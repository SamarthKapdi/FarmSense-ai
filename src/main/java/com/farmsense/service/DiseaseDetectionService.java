package com.farmsense.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsense.model.dto.DetectionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Production-grade crop disease detection using Google Gemini 1.5 Flash Vision API.
 * Direct HTTP implementation for reliability.
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

    @Value("${app.ai.gemini-model:gemini-1.5-flash}")
    private String geminiModel;

    public DiseaseDetectionService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PUBLIC ENTRY POINT
    // ═════════════════════════════════════════════════════════════════════════════

    public DetectionResult analyzeImage(byte[] imageBytes, String crop, String language) {
        long startTime = System.currentTimeMillis();

        log.info("╔══════════════════════════════════════════════════════════╗");
        log.info("║  GEMINI DISEASE DETECTION PIPELINE START               ║");
        log.info("║  Crop: {}, Language: {}, Image: {} bytes", crop, language,
                imageBytes == null ? 0 : imageBytes.length);
        log.info("╚══════════════════════════════════════════════════════════╝");

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("Image bytes cannot be empty");
        }

        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            throw new IllegalStateException("GEMINI_API_KEY environment variable is required");
        }

        // PHASE 1: Gemini Vision API with retries
        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                long attemptStartTime = System.currentTimeMillis();
                log.info("[RETRY {}] Starting Gemini Vision analysis for crop={}, imageSize={}bytes", 
                        attempt, crop, imageBytes.length);
                DetectionResult result = analyzeWithGemini(imageBytes, crop, language);
                long attemptDuration = System.currentTimeMillis() - attemptStartTime;
                log.info("[RETRY {}] ✅ SUCCESS - Gemini analysis completed in {}ms (totalTime={}ms, attempt={})",
                        attempt, attemptDuration, System.currentTimeMillis() - startTime, attempt);
                return result;
            } catch (Exception e) {
                lastException = e;
                long attemptDuration = System.currentTimeMillis() - startTime;
                log.warn("[RETRY {}] ❌ FAILED - Attempt {} of {} failed after {}ms: {} | Cause: {}", 
                        attempt, attempt, MAX_RETRIES, attemptDuration, e.getClass().getSimpleName(), e.getMessage());
                if (attempt < MAX_RETRIES) {
                    long backoffTime = BACKOFF_MS[attempt - 1];
                    log.info("[RETRY {}] Waiting {}ms before retry...", attempt, backoffTime);
                    sleep(backoffTime);
                }
            }
        }

        long totalTime = System.currentTimeMillis() - startTime;
        log.error("[RETRY EXHAUSTED] 🔴 All {} Gemini attempts failed after {}ms | LastError: {} | Message: {}", 
                MAX_RETRIES, totalTime, lastException != null ? lastException.getClass().getSimpleName() : "UNKNOWN",
                lastException != null ? lastException.getMessage() : "No message available");
        throw new RuntimeException(
                "Gemini API is busy or unreachable after " + MAX_RETRIES + " attempts (" + totalTime + "ms). " +
                "Please try again in a moment. Technical: " +
                (lastException != null ? lastException.getMessage() : "unknown error"));
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // GEMINI VISION ANALYSIS
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult analyzeWithGemini(byte[] imageBytes, String crop, String language) throws Exception {
        String prompt = buildGeminiPrompt(crop);
        long requestStartTime = System.currentTimeMillis();
        log.info("[GEMINI] Starting image analysis: crop={}, language={}, imageSize={}bytes, model={}, timeout=45s", 
                crop, language, imageBytes.length, geminiModel);

        try {
            // Convert image to base64
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            log.debug("[GEMINI] Base64 encoding complete: {}bytes -> {}chars", imageBytes.length, base64Image.length());

            // Build Gemini API request
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                    "parts", List.of(
                        Map.of("text", prompt),
                        Map.of(
                            "inline_data", Map.of(
                                "mime_type", "image/jpeg",
                                "data", base64Image
                            )
                        )
                    )
                )),
                "generationConfig", Map.of(
                    "temperature", 0.1,
                    "topK", 1,
                    "topP", 1,
                    "maxOutputTokens", 2048
                )
            );

            log.debug("[GEMINI] Sending request to Gemini API...");
            long apiCallStart = System.currentTimeMillis();
            
            String response = webClient.post()
                    .uri("https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(45))
                    .onErrorMap(e -> {
                        String errorType = e.getClass().getSimpleName();
                        log.error("[GEMINI] API call failed with {} after {}ms: {}", 
                                errorType, System.currentTimeMillis() - apiCallStart, e.getMessage());
                        if ("TimeoutException".equals(errorType)) {
                            return new RuntimeException(
                                    "Gemini API timeout after 45 seconds. The analysis took too long. Please try with a smaller image.", e);
                        }
                        return new RuntimeException(
                                "Gemini API error (" + errorType + "): " + e.getMessage(), e);
                    })
                    .block();

            long apiCallDuration = System.currentTimeMillis() - apiCallStart;
            log.info("[GEMINI] API call completed in {}ms", apiCallDuration);

            if (response == null || response.isBlank()) {
                throw new RuntimeException("Gemini API returned empty response after " + apiCallDuration + "ms");
            }

            log.info("[GEMINI] Response received: {}chars, total time {}ms", response.length(), System.currentTimeMillis() - requestStartTime);
            return parseGeminiResponse(response, crop, language);
        } catch (Exception e) {
            long totalTime = System.currentTimeMillis() - requestStartTime;
            log.error("[GEMINI] Analysis failed after {}ms: {} | Exception: {}", 
                    totalTime, e.getMessage(), e.getClass().getSimpleName(), e);
            throw e;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // GEMINI PROMPT — STRICT JSON FORMAT AS PER REQUIREMENTS
    // ═════════════════════════════════════════════════════════════════════════════

    private String buildGeminiPrompt(String crop) {
        String c = (crop == null || crop.isBlank()) ? "crop" : crop;
        return "You are a strict agricultural disease detector. " +
                "Examine this " + c + " image carefully for ANY signs of disease, rot, mold, spots, discoloration, wilting, or pest damage. " +
                "Be suspicious — if there is ANY visible abnormality, classify it as diseased. " +
                "Only classify as Healthy if the plant looks perfectly green and undamaged. " +
                "Return ONLY valid JSON with NO markdown, NO code blocks, NO explanations: " +
                "{\"disease\":\"EXACT DISEASE NAME\",\"confidence\":75,\"severity\":\"moderate\",\"organicTreatment\":\"treatment\",\"chemicalTreatment\":\"treatment\",\"prevention\":\"steps\",\"yieldImpact\":\"impact\"}";
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // GEMINI RESPONSE PARSER — STRICT JSON ONLY
    // ═════════════════════════════════════════════════════════════════════════════

    private DetectionResult parseGeminiResponse(String raw, String crop, String language) throws Exception {
        log.info("Parsing Gemini response: {} chars", raw.length());

        try {
            JsonNode root = objectMapper.readTree(raw);

            // Check for API errors
            if (root.has("error")) {
                String errorMsg = root.get("error").get("message").asText();
                throw new RuntimeException("Gemini API error: " + errorMsg);
            }

            // Extract the text content from candidates
            String textContent = null;
            if (root.has("candidates") && root.get("candidates").isArray()) {
                JsonNode firstCandidate = root.get("candidates").get(0);
                if (firstCandidate != null && firstCandidate.has("content") && firstCandidate.get("content").has("parts")) {
                    JsonNode parts = firstCandidate.get("content").get("parts");
                    if (parts.isArray() && parts.size() > 0) {
                        StringBuilder builder = new StringBuilder();
                        for (JsonNode part : parts) {
                            if (part.has("text")) {
                                builder.append(part.get("text").asText()).append('\n');
                            }
                        }
                        textContent = builder.toString().trim();
                    }
                }
            }

            if (textContent == null || textContent.isBlank()) {
                throw new RuntimeException("Gemini response does not contain text content");
            }

            log.info("Extracted text content:\n{}", textContent);

            // Extract JSON from the text content
            String json = extractJson(textContent);
            if (json == null) {
                throw new RuntimeException("Gemini response does not contain valid JSON");
            }

            log.info("Extracted JSON:\n{}", json);
            GeminiDetectionResponse geminiResponse = objectMapper.readValue(json, GeminiDetectionResponse.class);
            if (geminiResponse.disease == null || geminiResponse.disease.isBlank()) {
                throw new RuntimeException("Gemini response missing disease field");
            }

            // Convert to our DetectionResult format
            return convertGeminiToDetectionResult(geminiResponse, crop, language);

        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            throw new RuntimeException("Gemini returned invalid response format: " + e.getMessage());
        }
    }

    // DTO for Gemini response
    private static class GeminiDetectionResponse {
        public String disease;
        public int confidence;
        public String severity;
        public String organicTreatment;
        public String chemicalTreatment;
        public String prevention;
        public String yieldImpact;
    }
    private DetectionResult convertGeminiToDetectionResult(GeminiDetectionResponse gemini, String crop, String language) {
        boolean healthy = "healthy".equalsIgnoreCase(gemini.disease);

        return DetectionResult.builder()
                .disease(gemini.disease)
                .diseaseName(gemini.disease)
                .cropName(crop != null ? crop : "Crop")
                .description(healthy ? crop + " appears healthy" : "Disease symptoms detected in " + crop)
                .confidence(Math.max(0, Math.min(100, gemini.confidence)))
                .severity(gemini.severity != null ? gemini.severity : (healthy ? "none" : "moderate"))
                .yieldLossPercent(healthy ? 0.0 : 15.0) // Default if not provided
                .yieldLossEstimate(healthy ? "0%" : "15%")
                .organic(gemini.organicTreatment != null ? gemini.organicTreatment : (healthy ? "None required" : "Apply neem oil 5ml/litre. Consult local KVK."))
                .chemical(gemini.chemicalTreatment != null ? gemini.chemicalTreatment : (healthy ? "None required" : "Consult agricultural expert for approved fungicide"))
                .preventive(gemini.prevention != null ? gemini.prevention : "Regular monitoring. Proper drainage. Crop rotation.")
                .symptoms(List.of(healthy ? "No symptoms" : "See analysis"))
                .organicTreatment(List.of(healthy ? "No treatment needed" : "Apply neem oil 5ml per litre of water"))
                .chemicalTreatment(List.of(healthy ? "No treatment needed" : "Consult local KVK for approved chemicals"))
                .preventiveMeasures(List.of("Regular crop monitoring", "Proper drainage", "Crop rotation"))
                .bestTimeToTreat(healthy ? "No treatment needed" : "Early morning or late evening")
                .estimatedRecoveryCost(healthy ? "₹0" : "₹500-2000 per acre (varies)")
                .isHealthy(healthy)
                .urgencyLevel(healthy ? "NONE" : "MONITOR")
                .language(language == null ? "en" : language)
                .timestamp(LocalDateTime.now())
                .build();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // JSON EXTRACTION UTILITY
    // ═════════════════════════════════════════════════════════════════════════════

    private String extractJson(String response) {
        String trimmed = response == null ? "" : response.trim();
        trimmed = trimmed.replaceAll("(?is)^```(?:json)?\\s*", "");
        trimmed = trimmed.replaceAll("(?is)```\\s*$", "");

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            String candidate = trimmed.substring(start, end + 1);
            try {
                objectMapper.readTree(candidate);
                return candidate;
            } catch (Exception ignored) {
                // fall through to null
            }
        }
        return null;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═════════════════════════════════════════════════════════════════════════════

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}