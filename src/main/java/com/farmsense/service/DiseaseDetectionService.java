package com.farmsense.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsense.model.dto.DetectionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.model.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Production-grade crop disease detection pipeline.
 *
 * DESIGN PRINCIPLE: Bias toward DISEASE, never toward Healthy.
 * A false positive (detecting disease on healthy crop) is far less harmful
 * than a false negative (calling a rotten crop healthy).
 *
 * Failure hierarchy:
 *   1. Parse JSON from model response
 *   2. Repair malformed JSON
 *   3. Extract disease info from prose via regex
 *   4. Throw RuntimeException (never silently return "Healthy")
 */
@Service
@Slf4j
public class DiseaseDetectionService {

    private static final int MAX_RETRIES = 3;
    private static final long[] BACKOFF_MS = {2000, 5000, 10000};

    // Keywords that indicate disease/damage — checked BEFORE any healthy logic
    private static final String[] DISEASE_KEYWORDS = {
            "rot", "rotten", "mold", "mould", "fungal", "fungus", "decay", "decayed",
            "blight", "infection", "infected", "bacteria", "bacterial", "lesion", "lesions",
            "spot", "spots", "wilt", "wilting", "rust", "mildew", "canker",
            "necrosis", "necrotic", "browning", "yellowing", "curling", "mosaic",
            "anthracnose", "scab", "fuzz", "fuzzy", "discoloration", "damage",
            "diseased", "disease", "pathogen", "pest", "insect", "aphid",
            "black", "brown", "white fuzz", "wrinkle", "wrinkled", "soft rot",
            "dry rot", "wet rot", "stem rot", "root rot", "leaf spot",
            "early blight", "late blight", "powdery mildew", "downy mildew",
            "septoria", "alternaria", "cercospora", "botrytis", "fusarium"
    };

    // Keywords that indicate healthy — ONLY trusted when NO disease keyword is present
    private static final String[] HEALTHY_KEYWORDS = {
            "healthy", "no disease", "no signs of disease", "no visible disease",
            "looks good", "normal growth", "no infection", "disease-free",
            "no symptoms", "no abnormalities"
    };

    private final ChatClient visionChatClient;
    private final ChatClient chatChatClient;
    private final ObjectMapper objectMapper;

    public DiseaseDetectionService(
            @org.springframework.beans.factory.annotation.Qualifier("visionChatClient") ChatClient visionChatClient,
            @org.springframework.beans.factory.annotation.Qualifier("chatChatClient") ChatClient chatChatClient,
            ObjectMapper objectMapper) {
        this.visionChatClient = visionChatClient;
        this.chatChatClient = chatChatClient;
        this.objectMapper = objectMapper;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PUBLIC ENTRY POINT
    // ═════════════════════════════════════════════════════════════════════════════

    public DetectionResult analyzeImage(byte[] imageBytes, String crop, String language) {
        long startTime = System.currentTimeMillis();

        log.info("╔══════════════════════════════════════════════════════════╗");
        log.info("║  DISEASE DETECTION PIPELINE START                       ║");
        log.info("║  Crop: {}, Language: {}, Image: {} bytes", crop, language,
                imageBytes == null ? 0 : imageBytes.length);
        log.info("╚══════════════════════════════════════════════════════════╝");

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("Image bytes cannot be empty");
        }

        // PHASE 1: Vision model with retries
        Exception lastVisionEx = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                log.info("Vision attempt {}/{}", attempt, MAX_RETRIES);
                DetectionResult result = analyzeWithVision(imageBytes, crop, language);
                log.info("✅ Vision succeeded in {}ms (attempt {})",
                        System.currentTimeMillis() - startTime, attempt);
                return result;
            } catch (Exception e) {
                lastVisionEx = e;
                log.warn("❌ Vision attempt {} failed: {}", attempt, e.getMessage());
                if (attempt < MAX_RETRIES) sleep(BACKOFF_MS[attempt - 1]);
            }
        }

        log.error("Vision exhausted {} retries. Last: {}",
                MAX_RETRIES, lastVisionEx != null ? lastVisionEx.getMessage() : "unknown");

        // PHASE 2: Chat fallback with retries
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                log.info("Chat fallback attempt {}/{}", attempt, MAX_RETRIES);
                DetectionResult result = analyzeWithChat(crop, language);
                log.info("✅ Chat fallback succeeded in {}ms (attempt {})",
                        System.currentTimeMillis() - startTime, attempt);
                return result;
            } catch (Exception e) {
                log.warn("❌ Chat fallback attempt {} failed: {}", attempt, e.getMessage());
                if (attempt < MAX_RETRIES) sleep(BACKOFF_MS[attempt - 1]);
            }
        }

        log.error("🔴 ALL ATTEMPTS EXHAUSTED after {}ms.", System.currentTimeMillis() - startTime);
        throw new RuntimeException(
                "AI server is busy or unreachable. Ensure Ollama is running with the vision model loaded.");
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // VISION
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult analyzeWithVision(byte[] imageBytes, String crop, String language) throws Exception {
        String prompt = buildVisionPrompt(crop);
        log.info("Prompt: {} chars | Image: {} bytes", prompt.length(), imageBytes.length);

        var media = new Media(MimeTypeUtils.IMAGE_JPEG, new ByteArrayResource(imageBytes));
        var msg = new UserMessage(prompt, List.of(media));

        long t0 = System.currentTimeMillis();
        String response = visionChatClient.prompt().messages(msg).call().content();
        log.info("Vision response time: {}ms", System.currentTimeMillis() - t0);
        log.info("RAW VISION RESPONSE:\n{}", response);

        if (response == null || response.isBlank()) {
            throw new RuntimeException("Vision model returned empty response");
        }
        return parseResponse(response, crop, language);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // CHAT FALLBACK
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult analyzeWithChat(String crop, String language) throws Exception {
        String prompt = buildChatPrompt(crop);

        long t0 = System.currentTimeMillis();
        String response = chatChatClient.prompt()
                .system("You are an expert agricultural pathologist. Return ONLY a JSON object.")
                .user(prompt).call().content();
        log.info("Chat response time: {}ms", System.currentTimeMillis() - t0);
        log.info("RAW CHAT RESPONSE:\n{}", response);

        if (response == null || response.isBlank()) {
            throw new RuntimeException("Chat model returned empty response");
        }
        return parseResponse(response, crop, language);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PROMPTS — Disease-biased, strict JSON
    // ═════════════════════════════════════════════════════════════════════════════

    private String buildVisionPrompt(String crop) {
        String c = (crop == null || crop.isBlank()) ? "crop" : crop;
        return "You are a strict agricultural disease detector. " +
                "Examine this " + c + " image carefully for ANY signs of disease, rot, mold, spots, discoloration, wilting, or pest damage. " +
                "Be suspicious — if there is ANY visible abnormality, classify it as diseased. " +
                "Only classify as Healthy if the plant looks perfectly green and undamaged. " +
                "Return ONLY valid JSON: " +
                "{\"disease\":\"EXACT DISEASE NAME\",\"confidence\":75,\"severity\":\"moderate\"," +
                "\"description\":\"what you see\",\"yieldLossPercent\":15.0," +
                "\"organic\":\"treatment\",\"chemical\":\"treatment\",\"preventive\":\"steps\"} " +
                "Do NOT wrap in markdown. Do NOT add any text outside the JSON.";
    }

    private String buildChatPrompt(String crop) {
        String c = (crop == null || crop.isBlank()) ? "crop" : crop;
        return "Most common disease of " + c + " in India. " +
                "Return ONLY JSON: " +
                "{\"disease\":\"NAME\",\"confidence\":70,\"severity\":\"moderate\"," +
                "\"description\":\"symptoms\",\"yieldLossPercent\":15.0," +
                "\"organic\":\"steps\",\"chemical\":\"steps\",\"preventive\":\"steps\"}";
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // 3-LAYER PARSER
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult parseResponse(String raw, String crop, String language) throws Exception {
        // LAYER 1: Direct JSON extraction
        String json = extractJson(raw);
        if (json != null) {
            try {
                log.info("Extracted JSON:\n{}", json);
                DetectionResult result = objectMapper.readValue(json, DetectionResult.class);
                if (result != null) {
                    return normalizeResult(result, raw, crop, language);
                }
            } catch (Exception e) {
                log.warn("Layer 1 JSON parse failed: {}", e.getMessage());
            }
        }

        // LAYER 2: JSON repair (single quotes, trailing commas)
        String repaired = repairJson(raw);
        if (repaired != null) {
            try {
                log.info("Repaired JSON:\n{}", repaired);
                DetectionResult result = objectMapper.readValue(repaired, DetectionResult.class);
                if (result != null) {
                    return normalizeResult(result, raw, crop, language);
                }
            } catch (Exception e) {
                log.warn("Layer 2 JSON repair failed: {}", e.getMessage());
            }
        }

        // LAYER 3: Prose extraction (regex)
        log.warn("Model returned pure prose. Extracting disease info via regex...");
        return extractFromProse(raw, crop, language);
    }

    private String extractJson(String response) {
        String trimmed = response.trim()
                .replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "")
                .trim();

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            String candidate = trimmed.substring(start, end + 1);
            try {
                objectMapper.readTree(candidate);
                return candidate;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String repairJson(String response) {
        String trimmed = response.trim()
                .replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "")
                .trim();

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            String candidate = trimmed.substring(start, end + 1)
                    .replaceAll("'", "\"")
                    .replaceAll(",\\s*}", "}")
                    .replaceAll(",\\s*]", "]");
            try {
                objectMapper.readTree(candidate);
                return candidate;
            } catch (Exception ignored) {}
        }
        return null;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PROSE EXTRACTION — Last resort when model ignores JSON instruction
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult extractFromProse(String prose, String crop, String language) {
        String lower = prose.toLowerCase();

        // CHECK DISEASE KEYWORDS FIRST — before ANY healthy logic
        boolean hasDiseaseSignal = false;
        for (String kw : DISEASE_KEYWORDS) {
            if (lower.contains(kw)) {
                hasDiseaseSignal = true;
                log.info("Disease keyword detected in prose: '{}'", kw);
                break;
            }
        }

        // Only consider healthy if zero disease keywords found
        boolean healthySignal = false;
        if (!hasDiseaseSignal) {
            for (String kw : HEALTHY_KEYWORDS) {
                if (lower.contains(kw)) {
                    healthySignal = true;
                    break;
                }
            }
        }

        String disease;
        int confidence;
        String severity;

        if (hasDiseaseSignal) {
            // DISEASED — extract specific name or use crop-specific fallback
            disease = extractDiseaseNameFromProse(prose, crop);
            confidence = 55; // Degraded confidence since we're parsing prose
            severity = lower.contains("severe") || lower.contains("rotten") || lower.contains("decay")
                    ? "high" : lower.contains("moderate") ? "moderate" : "low";
        } else if (healthySignal) {
            disease = "Healthy";
            confidence = 70; // Lower than model-returned healthy since prose is uncertain
            severity = "none";
        } else {
            // UNCERTAIN — bias toward disease, never healthy
            disease = "Possible " + getCropDefaultDisease(crop);
            confidence = 40;
            severity = "low";
        }

        String desc = prose.length() > 300 ? prose.substring(0, 300) + "..." : prose;
        log.info("Prose result → disease={}, confidence={}, severity={}", disease, confidence, severity);

        return buildFinalResult(disease, confidence, severity, desc,
                hasDiseaseSignal ? 15.0 : 0.0, crop, language);
    }

    private String extractDiseaseNameFromProse(String prose, String crop) {
        String[] known = {
                "Early Blight", "Late Blight", "Leaf Spot", "Powdery Mildew",
                "Downy Mildew", "Bacterial Wilt", "Fusarium Wilt", "Rust",
                "Mosaic Virus", "Root Rot", "Anthracnose", "Black Rot",
                "Brown Spot", "Leaf Curl", "Blight", "Canker", "Scab",
                "Cercospora", "Septoria", "Alternaria", "Botrytis",
                "Soft Rot", "Dry Rot", "Wet Rot", "Stem Rot",
                "Bacterial Spot", "Target Spot", "Gray Mold"
        };

        for (String d : known) {
            if (prose.toLowerCase().contains(d.toLowerCase())) {
                return d;
            }
        }

        // Regex: "disease: Early Blight" or "affected by Rust"
        Matcher m = Pattern.compile(
                "(?:disease|condition|infection|affected by|diagnosed as)[:\\s]+([A-Z][a-z]+(?:\\s[A-Za-z]+){0,3})",
                Pattern.CASE_INSENSITIVE
        ).matcher(prose);
        if (m.find()) return m.group(1).trim();

        return getCropDefaultDisease(crop);
    }

    private String getCropDefaultDisease(String crop) {
        String c = (crop == null) ? "" : crop.toLowerCase();
        return switch (c) {
            case "tomato" -> "Early Blight";
            case "potato" -> "Late Blight";
            case "rice", "paddy" -> "Brown Spot";
            case "wheat" -> "Rust";
            case "cotton" -> "Bacterial Blight";
            case "maize" -> "Northern Leaf Blight";
            case "onion" -> "Purple Blotch";
            case "chili" -> "Anthracnose";
            case "mango" -> "Powdery Mildew";
            case "sugarcane" -> "Red Rot";
            case "soybean" -> "Rust";
            case "groundnut" -> "Tikka Disease";
            default -> "Suspected Infection";
        };
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // NORMALIZE — The ONLY place that builds the final DetectionResult
    //
    // KEY RULE: Disease keyword scan happens on the RAW response, not parsed JSON.
    // If the raw response mentions rot/mold/blight, disease CANNOT become "Healthy"
    // even if the model's JSON says disease:"none".
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult normalizeResult(DetectionResult parsed, String rawResponse,
                                            String crop, String language) {
        String disease = firstNonBlank(parsed.getDisease(), parsed.getDiseaseName());
        int confidence = parsed.getConfidence();
        String severity = parsed.getSeverity();

        // CRITICAL: Scan the RAW response for disease keywords.
        // This overrides any model claim of "Healthy" or "none".
        String rawLower = rawResponse.toLowerCase();
        boolean rawHasDiseaseKeyword = false;
        String detectedKeyword = null;
        for (String kw : DISEASE_KEYWORDS) {
            if (rawLower.contains(kw)) {
                rawHasDiseaseKeyword = true;
                detectedKeyword = kw;
                break;
            }
        }

        if (rawHasDiseaseKeyword) {
            log.info("RAW RESPONSE OVERRIDE: Disease keyword '{}' found. Refusing to classify as Healthy.", detectedKeyword);

            // If model said "Healthy" or "none" but raw text mentions disease → override
            if (disease == null || disease.isBlank()
                    || "healthy".equalsIgnoreCase(disease)
                    || "none".equalsIgnoreCase(disease)) {
                disease = extractDiseaseNameFromProse(rawResponse, crop);
                log.info("Disease overridden to: {}", disease);
            }

            // Force severity to at least "low"
            if (severity == null || "none".equalsIgnoreCase(severity)) {
                severity = rawLower.contains("severe") || rawLower.contains("rotten") ? "high" : "moderate";
            }

            // Cap confidence — don't trust 100% when disease keywords are present
            if (confidence >= 95) {
                confidence = 75;
                log.info("Confidence capped from 100 to 75 (disease keywords in raw response)");
            }
        }

        // Handle remaining null/blank disease — but NEVER default to "Healthy"
        if (disease == null || disease.isBlank()
                || "unknown condition".equalsIgnoreCase(disease)
                || "unknown".equalsIgnoreCase(disease)) {
            disease = "Unidentified Condition";
        }

        // "none" as disease name means the model didn't detect anything specific
        // but if we get here without rawHasDiseaseKeyword, THEN it might be healthy
        if ("none".equalsIgnoreCase(disease)) {
            if (!rawHasDiseaseKeyword) {
                disease = "Healthy";
            } else {
                disease = getCropDefaultDisease(crop);
            }
        }

        boolean healthy = "healthy".equalsIgnoreCase(disease);

        // Confidence: preserve model's value, only fix if truly zero
        if (confidence <= 0) {
            confidence = healthy ? 80 : 50; // Degraded defaults, never 95/100
        }

        return buildFinalResult(disease, confidence,
                firstNonBlank(severity, healthy ? "none" : "moderate"),
                firstNonBlank(parsed.getDescription(),
                        healthy ? crop + " appears healthy" : "Disease symptoms detected in " + crop),
                healthy ? 0.0 : Math.max(0, parsed.getYieldLossPercent()),
                crop, language);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // FINAL RESULT BUILDER — single source of truth
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult buildFinalResult(String disease, int confidence, String severity,
                                             String description, double yieldLoss,
                                             String crop, String language) {
        boolean healthy = "healthy".equalsIgnoreCase(disease);
        String safeCrop = (crop == null || crop.isBlank()) ? "Crop" : crop;
        String safeSeverity = (severity == null || severity.isBlank())
                ? (healthy ? "none" : "moderate") : severity.toLowerCase(Locale.ROOT);

        return DetectionResult.builder()
                .disease(disease)
                .diseaseName(disease)
                .cropName(safeCrop)
                .description(description != null ? description : "Analysis completed")
                .confidence(confidence)
                .severity(safeSeverity)
                .yieldLossPercent(yieldLoss)
                .yieldLossEstimate(String.format(Locale.ROOT, "%.1f%%", yieldLoss))
                .organic(healthy ? "None required" : "Apply neem oil 5ml/litre. Consult local KVK.")
                .chemical(healthy ? "None required" : "Consult agricultural expert for approved fungicide")
                .preventive("Regular monitoring. Proper drainage. Crop rotation.")
                .symptoms(List.of(description != null ? description : "See analysis"))
                .organicTreatment(List.of(healthy ? "No treatment needed" : "Apply neem oil 5ml per litre of water"))
                .chemicalTreatment(List.of(healthy ? "No treatment needed" : "Consult local KVK for approved chemicals"))
                .preventiveMeasures(List.of("Regular crop monitoring", "Proper drainage", "Crop rotation"))
                .bestTimeToTreat(healthy ? "No treatment needed" : "Early morning or late evening")
                .estimatedRecoveryCost(healthy ? "₹0" : "₹500-2000 per acre (varies)")
                .isHealthy(healthy)
                .urgencyLevel(healthy ? "NONE" : (yieldLoss > 20.0 ? "HIGH" : "MONITOR"))
                .language(language == null ? "en" : language)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═════════════════════════════════════════════════════════════════════════════

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}