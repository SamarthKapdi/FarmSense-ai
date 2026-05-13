package com.farmsense.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsense.model.dto.DetectionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Production-grade crop disease detection using Google Gemini 2.5 Flash Vision API.
 * Returns rich, crop-specific, disease-specific agricultural intelligence.
 */
@Service
@Slf4j
public class DiseaseDetectionService {

    private static final int MAX_RETRIES = 3;
    private static final long[] BACKOFF_MS = {2000, 5000, 10000};

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini-model:gemini-2.5-flash}")
    private String geminiModel;

    public DiseaseDetectionService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024))
                .build();
        this.objectMapper = objectMapper.copy()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    @jakarta.annotation.PostConstruct
    void logStartupDiagnostics() {
        boolean geminiKeyPresent = geminiApiKey != null && !geminiApiKey.trim().isEmpty();
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent";
        log.info("═══════════════════════════════════════════════════════════");
        log.info("  DiseaseDetection Service INITIALIZED");
        log.info("  Gemini API Key configured: {} (length={})", geminiKeyPresent,
                geminiApiKey != null ? geminiApiKey.trim().length() : 0);
        log.info("  Gemini Model: {}", geminiModel);
        log.info("  Gemini Endpoint: {}", endpoint);
        log.info("═══════════════════════════════════════════════════════════");
        if (!geminiKeyPresent) {
            log.error("GEMINI_API_KEY IS NOT SET! Disease detection will fail for all requests.");
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PUBLIC ENTRY POINT
    // ═════════════════════════════════════════════════════════════════════════════

    public DetectionResult analyzeImage(byte[] imageBytes, String crop, String language) {
        long startTime = System.currentTimeMillis();
        log.info("[DETECT] Pipeline START — crop={}, lang={}, imageSize={}bytes", crop, language,
                imageBytes == null ? 0 : imageBytes.length);

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("Image bytes cannot be empty");
        }
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY environment variable is required");
        }

        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                long attemptStart = System.currentTimeMillis();
                log.info("[DETECT] Attempt {}/{} — sending to Gemini Vision", attempt, MAX_RETRIES);
                DetectionResult result = analyzeWithGemini(imageBytes, crop, language);
                log.info("[DETECT] Attempt {}/{} SUCCESS in {}ms (total={}ms)",
                        attempt, MAX_RETRIES, System.currentTimeMillis() - attemptStart,
                        System.currentTimeMillis() - startTime);
                return result;
            } catch (Exception e) {
                lastException = e;
                log.warn("[DETECT] Attempt {}/{} FAILED: {} — {}", attempt, MAX_RETRIES,
                        e.getClass().getSimpleName(), e.getMessage());
                if (attempt < MAX_RETRIES) {
                    sleep(BACKOFF_MS[attempt - 1]);
                }
            }
        }

        long totalTime = System.currentTimeMillis() - startTime;
        log.error("[DETECT] ALL {} attempts failed after {}ms — {}", MAX_RETRIES, totalTime,
                lastException != null ? lastException.getMessage() : "unknown");
        throw new RuntimeException(
                "AI analysis failed after " + MAX_RETRIES + " attempts (" + totalTime + "ms). " +
                "Please try again. " + (lastException != null ? lastException.getMessage() : ""));
    }

    /**
     * Analyze an image with Gemini Vision and return a quick text summary.
     * Used by KrishiGPT chatbot for image-based questions.
     */
    public String analyzeImageForChat(byte[] imageBytes, String crop) {
        if (imageBytes == null || imageBytes.length == 0) return null;
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) return null;

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String prompt = "You are an expert agricultural scientist. Analyze this " +
                    (crop != null ? crop : "crop") + " image. " +
                    "Describe what you see: the plant's health, any visible diseases, pests, " +
                    "discoloration, spots, wilting, or damage. " +
                    "Be specific about symptoms. Keep it under 100 words. " +
                    "If the image is not a plant, say so.";

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inline_data", Map.of("mime_type", "image/jpeg", "data", base64Image))
                    )
                )),
                "generationConfig", Map.of("temperature", 0.3, "maxOutputTokens", 300)
            );

            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" +
                    geminiModel + ":generateContent?key=" + geminiApiKey;

            String response = webClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                if (root.has("candidates") && root.get("candidates").isArray()) {
                    JsonNode parts = root.get("candidates").get(0).path("content").path("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        return parts.get(0).path("text").asText("");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[GEMINI-CHAT] Image analysis failed: {}", e.getMessage());
        }
        return null;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // GEMINI VISION ANALYSIS
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult analyzeWithGemini(byte[] imageBytes, String crop, String language) throws Exception {
        String prompt = buildExpertPrompt(crop);
        long requestStartTime = System.currentTimeMillis();

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inline_data", Map.of("mime_type", "image/jpeg", "data", base64Image))
                    )
                )),
                "generationConfig", Map.of(
                    "temperature", 0.2,
                    "topP", 0.95,
                    "maxOutputTokens", 4096
                )
            );

            String geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/" +
                    geminiModel + ":generateContent?key=" + geminiApiKey;
            log.info("[GEMINI] Sending request — model={}", geminiModel);

            long apiCallStart = System.currentTimeMillis();
            String response = webClient.post()
                    .uri(geminiEndpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(60))
                    .onErrorMap(e -> {
                        long duration = System.currentTimeMillis() - apiCallStart;
                        if (e instanceof WebClientResponseException wcre) {
                            int status = wcre.getStatusCode().value();
                            log.error("[GEMINI] HTTP {} after {}ms | Body: {}", status, duration, wcre.getResponseBodyAsString());
                            if (status == 429) return new RuntimeException("AI_QUOTA_EXCEEDED: Gemini API rate limit or quota exceeded.");
                            if (status == 401 || status == 403) return new RuntimeException("AI_AUTH_FAILURE: Invalid Gemini API key.");
                            if (status >= 500) return new RuntimeException("AI_UPSTREAM_OUTAGE: Gemini API is currently down.");
                        } else if (e instanceof java.util.concurrent.TimeoutException) {
                            log.error("[GEMINI] Timeout after {}ms", duration);
                            return new RuntimeException("AI_TIMEOUT: Gemini API took too long to respond.");
                        }
                        log.error("[GEMINI] Failed with {} after {}ms: {}", e.getClass().getSimpleName(), duration, e.getMessage());
                        return new RuntimeException("AI_UNKNOWN_ERROR: " + e.getMessage(), e);
                    })
                    .block();

            log.info("[GEMINI] Response received in {}ms — {}chars",
                    System.currentTimeMillis() - apiCallStart,
                    response != null ? response.length() : 0);

            if (response == null || response.isBlank()) {
                throw new RuntimeException("Gemini returned empty response");
            }

            return parseGeminiResponse(response, crop, language);

        } catch (Exception e) {
            log.error("[GEMINI] Analysis failed after {}ms: {}",
                    System.currentTimeMillis() - requestStartTime, e.getMessage());
            throw e;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EXPERT AGRONOMIST PROMPT — DISEASE-SPECIFIC, CROP-SPECIFIC
    // ═════════════════════════════════════════════════════════════════════════════

    private String buildExpertPrompt(String crop) {
        String c = (crop == null || crop.isBlank()) ? "crop" : crop.trim();
        return """
            You are a senior plant pathologist with 25 years of experience in Indian agriculture.
            
            TASK: Examine this %s image with extreme precision. Identify any disease, pest damage, \
            nutrient deficiency, or abnormality. If the plant looks perfectly healthy, say so.
            
            CRITICAL RULES:
            - NEVER hallucinate diseases that cannot affect %s
            - Only diagnose diseases that are known to occur in %s cultivation
            - If uncertain, set confidence below 60 and explain why
            - Explain image quality issues (blurry, dark, distant) and reduce confidence if so
            - Provide a differential diagnosis with EXPLICIT reasoning on why the primary was chosen over alternatives
            - DO NOT use repetitive generic phrases like "consult KVK", "neem oil", "crop rotation", or "proper drainage" blindly. Be specific to the exact context.
            - If the image is NOT a %s plant, say "Not a recognizable crop image"
            - Base yield loss on actual agricultural research, not guesses
            - Treatments must be specific to %s — different crops need different treatments
            
            Return ONLY a valid JSON object with NO markdown, NO code fences, NO explanation text.
            The JSON must have exactly these fields:
            
            {
              "disease": "exact disease name or 'Healthy'",
              "scientificName": "Latin binomial of the pathogen, or 'N/A' if healthy",
              "confidence": 75,
              "confidenceReasoning": "explain what visual evidence supports this diagnosis",
              "imageQualityScore": 85,
              "imageQualityReasoning": "clarity, focus, lighting evaluation",
              "severity": "mild|moderate|severe|critical",
              "symptoms": ["symptom 1 visible in image", "symptom 2", "symptom 3"],
              "spreadRisk": "low|moderate|high|very high",
              "spreadMechanism": "how this disease spreads (wind/water/soil/insects/seeds)",
              "environmentalCauses": ["cause 1", "cause 2"],
              "organicTreatment": ["specific organic treatment 1 with dosage", "treatment 2"],
              "chemicalTreatment": ["specific chemical/fungicide name with concentration", "chemical 2"],
              "dosage": ["dosage instruction 1", "dosage instruction 2"],
              "sprayInterval": "e.g. 'Every 7-10 days for 3 applications'",
              "preventiveMeasures": ["specific prevention 1", "prevention 2", "prevention 3"],
              "yieldLossPercent": 25,
              "yieldLossReasoning": "explain basis for this estimate",
              "estimatedRecoveryCost": "realistic cost in INR per acre",
              "bestTreatmentTime": "specific time and conditions for treatment",
              "progressionSpeed": "slow|moderate|rapid",
              "recoverability": "full recovery|partial recovery|manage only|crop loss likely",
              "monitoringAdvice": "what to watch for in next 7 days",
              "differentialDiagnosis": ["other disease this could be confused with"],
              "differentialDiagnosisReasoning": "explain why the primary disease was selected over these alternatives",
              "weatherImpact": "how current/recent weather affects this condition",
              "soilImpact": "soil conditions that contribute",
              "wateringAdvice": "specific irrigation guidance for this condition",
              "fertilizerAdvice": "fertilizer adjustments needed"
            }
            
            IMPORTANT: Return ONLY the JSON object. No text before or after it.
            """.formatted(c, c, c, c, c);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // GEMINI RESPONSE PARSER — ROBUST JSON EXTRACTION
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult parseGeminiResponse(String raw, String crop, String language) throws Exception {
        log.info("[PARSE] Parsing Gemini response: {}chars", raw.length());

        JsonNode root = objectMapper.readTree(raw);

        // Check for API-level errors
        if (root.has("error")) {
            String errorMsg = root.path("error").path("message").asText("Unknown API error");
            throw new RuntimeException("Gemini API error: " + errorMsg);
        }

        // Extract text from candidates
        String textContent = extractTextFromCandidates(root);
        if (textContent == null || textContent.isBlank()) {
            throw new RuntimeException("Gemini response contains no text content");
        }

        log.info("[PARSE] Extracted text: {}chars", textContent.length());

        // Extract and parse JSON
        String json = extractJson(textContent);
        if (json == null) {
            throw new RuntimeException("No valid JSON found in Gemini response");
        }

        log.info("[PARSE] Extracted JSON: {}chars", json.length());

        GeminiRichResponse gemini = objectMapper.readValue(json, GeminiRichResponse.class);

        if (gemini.disease == null || gemini.disease.isBlank()) {
            throw new RuntimeException("Missing 'disease' field in AI response");
        }

        return buildDetectionResult(gemini, crop, language);
    }

    private String extractTextFromCandidates(JsonNode root) {
        if (!root.has("candidates") || !root.get("candidates").isArray()) return null;
        JsonNode firstCandidate = root.get("candidates").get(0);
        if (firstCandidate == null) return null;
        JsonNode parts = firstCandidate.path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) return null;

        StringBuilder sb = new StringBuilder();
        for (JsonNode part : parts) {
            if (part.has("text")) {
                sb.append(part.get("text").asText()).append('\n');
            }
        }
        return sb.toString().trim();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // RICH GEMINI RESPONSE DTO — matches the expanded prompt
    // ═════════════════════════════════════════════════════════════════════════════

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class GeminiRichResponse {
        public String disease;
        public String scientificName;
        public int confidence;
        public String confidenceReasoning;
        public int imageQualityScore;
        public String imageQualityReasoning;
        public String severity;
        public List<String> symptoms;
        public String spreadRisk;
        public String spreadMechanism;
        public List<String> environmentalCauses;
        public List<String> organicTreatment;
        public List<String> chemicalTreatment;
        public List<String> dosage;
        public String sprayInterval;
        public List<String> preventiveMeasures;
        public double yieldLossPercent;
        public String yieldLossReasoning;
        public String estimatedRecoveryCost;
        @JsonProperty("bestTreatmentTime")
        public String bestTimeToTreat;
        public String progressionSpeed;
        public String recoverability;
        public String monitoringAdvice;
        public List<String> differentialDiagnosis;
        public String differentialDiagnosisReasoning;
        public String weatherImpact;
        public String soilImpact;
        public String wateringAdvice;
        public String fertilizerAdvice;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // BUILD DETECTION RESULT — ZERO HARDCODED FALLBACKS
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult buildDetectionResult(GeminiRichResponse g, String crop, String language) {
        boolean healthy = "healthy".equalsIgnoreCase(g.disease) ||
                           "no disease".equalsIgnoreCase(g.disease);

        // Validate and calibrate confidence
        int calibratedConfidence = calibrateConfidence(g);

        // Determine urgency from severity
        String urgency = determineUrgency(g.severity, g.spreadRisk, g.progressionSpeed);

        return DetectionResult.builder()
                // Core
                .diseaseName(g.disease)
                .scientificName(g.scientificName)
                .cropName(crop != null ? crop : "Unknown crop")
                .description(buildDescription(g, crop, healthy))
                // Confidence & Image Quality
                .confidence(calibratedConfidence)
                .confidenceReasoning(g.confidenceReasoning)
                .imageQualityScore(g.imageQualityScore)
                .imageQualityReasoning(g.imageQualityReasoning)
                // Severity
                .severity(g.severity != null ? g.severity : (healthy ? "none" : "unknown"))
                .urgencyLevel(urgency)
                .progressionSpeed(g.progressionSpeed)
                .recoverability(g.recoverability)
                // Spread
                .spreadRisk(g.spreadRisk)
                .spreadMechanism(g.spreadMechanism)
                // Symptoms
                .symptoms(safeList(g.symptoms))
                // Environmental
                .environmentalCauses(safeList(g.environmentalCauses))
                .weatherImpact(g.weatherImpact)
                .soilImpact(g.soilImpact)
                .wateringAdvice(g.wateringAdvice)
                .fertilizerAdvice(g.fertilizerAdvice)
                // Treatment
                .organicTreatment(safeList(g.organicTreatment))
                .chemicalTreatment(safeList(g.chemicalTreatment))
                .dosage(safeList(g.dosage))
                .sprayInterval(g.sprayInterval)
                .preventiveMeasures(safeList(g.preventiveMeasures))
                .bestTimeToTreat(g.bestTimeToTreat)
                .monitoringAdvice(g.monitoringAdvice)
                // Economic
                .yieldLossPercent(healthy ? 0.0 : g.yieldLossPercent)
                .yieldLossEstimate(healthy ? "0%" : Math.round(g.yieldLossPercent) + "%")
                .yieldLossReasoning(g.yieldLossReasoning)
                .estimatedRecoveryCost(healthy ? "₹0" : g.estimatedRecoveryCost)
                // Differential
                .differentialDiagnosis(safeList(g.differentialDiagnosis))
                .differentialDiagnosisReasoning(g.differentialDiagnosisReasoning)
                // Meta
                .isHealthy(healthy)
                .language(language == null ? "en" : language)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Intelligent confidence calibration based on AI response quality signals.
     */
    private int calibrateConfidence(GeminiRichResponse g) {
        int raw = Math.max(0, Math.min(100, g.confidence));

        // If AI reports low symptoms, reduce confidence
        if (g.symptoms == null || g.symptoms.isEmpty()) {
            raw = Math.min(raw, 50);
        }
        // If no reasoning provided, cap at 70
        if (g.confidenceReasoning == null || g.confidenceReasoning.isBlank()) {
            raw = Math.min(raw, 70);
        }
        // If differential diagnosis has many entries, this is uncertain
        if (g.differentialDiagnosis != null && g.differentialDiagnosis.size() >= 3) {
            raw = Math.min(raw, 65);
        }
        // If image quality is poor, cap confidence
        if (g.imageQualityScore > 0 && g.imageQualityScore < 50) {
            raw = Math.min(raw, 50);
        } else if (g.imageQualityScore >= 50 && g.imageQualityScore < 70) {
            raw = Math.min(raw, 75);
        }

        return raw;
    }

    /**
     * Determine urgency from severity + spread risk + progression speed.
     */
    private String determineUrgency(String severity, String spreadRisk, String progressionSpeed) {
        if (severity == null) return "MONITOR";

        int score = 0;
        String sev = severity.toLowerCase();
        if (sev.contains("critical")) score += 4;
        else if (sev.contains("severe")) score += 3;
        else if (sev.contains("moderate")) score += 2;
        else if (sev.contains("mild")) score += 1;

        if (spreadRisk != null) {
            String sr = spreadRisk.toLowerCase();
            if (sr.contains("very high")) score += 3;
            else if (sr.contains("high")) score += 2;
            else if (sr.contains("moderate")) score += 1;
        }

        if (progressionSpeed != null && progressionSpeed.toLowerCase().contains("rapid")) {
            score += 2;
        }

        if (score >= 7) return "IMMEDIATE";
        if (score >= 5) return "HIGH";
        if (score >= 3) return "MODERATE";
        if (score >= 1) return "MONITOR";
        return "NONE";
    }

    private String buildDescription(GeminiRichResponse g, String crop, boolean healthy) {
        if (healthy) return crop + " plant appears healthy with no visible disease symptoms.";
        StringBuilder desc = new StringBuilder();
        desc.append(g.disease);
        if (g.scientificName != null && !"N/A".equals(g.scientificName)) {
            desc.append(" (").append(g.scientificName).append(")");
        }
        desc.append(" detected in ").append(crop != null ? crop : "crop").append(".");
        if (g.severity != null) {
            desc.append(" Severity: ").append(g.severity).append(".");
        }
        if (g.spreadRisk != null) {
            desc.append(" Spread risk: ").append(g.spreadRisk).append(".");
        }
        return desc.toString();
    }

    private List<String> safeList(List<String> list) {
        if (list == null || list.isEmpty()) return List.of();
        return list.stream().filter(s -> s != null && !s.isBlank()).toList();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // ROBUST JSON EXTRACTION — handles markdown, trailing commas, etc.
    // ═════════════════════════════════════════════════════════════════════════════

    private String extractJson(String response) {
        if (response == null || response.isBlank()) return null;

        String trimmed = response.trim();

        // Strip markdown code fences
        trimmed = trimmed.replaceAll("(?s)^```(?:json)?\\s*", "");
        trimmed = trimmed.replaceAll("(?s)```\\s*$", "");
        trimmed = trimmed.trim();

        // Find the outermost JSON object
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start < 0 || end <= start) return null;

        String candidate = trimmed.substring(start, end + 1);

        // Repair common JSON issues
        candidate = repairJson(candidate);

        // Validate it parses
        try {
            objectMapper.readTree(candidate);
            return candidate;
        } catch (Exception e) {
            log.warn("[PARSE] JSON validation failed after repair: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Repair common JSON issues from LLM output.
     */
    private String repairJson(String json) {
        // Remove trailing commas before } or ]
        json = json.replaceAll(",\\s*([}\\]])", "$1");
        // Fix single quotes to double quotes (crude but effective for simple cases)
        // Only if the JSON doesn't already parse
        try {
            objectMapper.readTree(json);
            return json; // Already valid
        } catch (Exception ignored) {}

        // Try replacing single quotes
        String repaired = json.replaceAll("'", "\"");
        try {
            objectMapper.readTree(repaired);
            return repaired;
        } catch (Exception ignored) {}

        return json; // Return original, let caller handle parse failure
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═════════════════════════════════════════════════════════════════════════════

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}