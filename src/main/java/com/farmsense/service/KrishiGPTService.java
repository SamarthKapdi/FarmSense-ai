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

import java.util.List;
import java.util.Map;
import java.time.Duration;

/**
 * KrishiGPT service using Groq Llama 3 API.
 * Direct HTTP implementation for reliability.
 */
@Service
@Slf4j
public class KrishiGPTService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    @Value("${app.ai.groq-model:llama3-8b-8192}")
    private String groqModel;

    public KrishiGPTService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    @jakarta.annotation.PostConstruct
    void logStartupDiagnostics() {
        boolean groqKeyPresent = groqApiKey != null && !groqApiKey.trim().isEmpty();
        log.info("═══════════════════════════════════════════════════════════");
        log.info("  KrishiGPT Service INITIALIZED");
        log.info("  Groq API Key configured: {} (length={})", groqKeyPresent, 
                groqApiKey != null ? groqApiKey.trim().length() : 0);
        log.info("  Groq Model: {}", groqModel);
        log.info("  Groq Endpoint: https://api.groq.com/openai/v1/chat/completions");
        log.info("═══════════════════════════════════════════════════════════");
        if (!groqKeyPresent) {
            log.error("⚠️ GROQ_API_KEY IS NOT SET! KrishiGPT will fail for all requests.");
        }
    }

    private static final Map<String, String> LANGUAGE_NAMES = Map.of(
            "en", "English",
            "hi", "Hindi",
            "ta", "Tamil",
            "te", "Telugu",
            "mr", "Marathi",
            "pa", "Punjabi");

    private String safeLanguageName(String langCode) {
        String normalized = (langCode == null || langCode.isBlank()) ? "en" : langCode;
        return LANGUAGE_NAMES.getOrDefault(normalized, "English");
    }

    public String askKrishiGPT(String userId, String question, String crop, String langCode, String imageBase64) {
        long startedAt = System.currentTimeMillis();
        log.info("[GROQ] === CHAT REQUEST START ===");
        log.info("[GROQ] API key configured: {}, key length: {}", 
                groqApiKey != null && !groqApiKey.trim().isEmpty(),
                groqApiKey != null ? groqApiKey.trim().length() : 0);
        log.info("[GROQ] Model: {}, Crop: {}, Language: {}, User: {}", groqModel, crop, langCode, userId);
        try {
            String language = safeLanguageName(langCode);
            String safeCrop = (crop == null || crop.isBlank()) ? "general" : crop;
            String safeQuestion = (question == null || question.isBlank())
                    ? "Share practical crop care advice for this week."
                    : question;

            String systemPrompt = """
                    You are KrishiGPT, an expert Indian agricultural scientist \
                    with 20 years of experience helping farmers across India.

                    STRICT RULES YOU MUST FOLLOW:
                    - Respond ONLY in %s language
                    - Be practical and specific to Indian farming conditions
                    - Keep your response under 150 words maximum
                    - Use simple language a farmer with basic education understands
                    - Current crop context: %s

                    SAFETY RULES (NEVER VIOLATE):
                    - NEVER invent or fabricate pesticide names, chemical names, or brand names
                    - NEVER quote specific prices unless you are absolutely certain
                    - NEVER recommend specific commercial products by brand name
                    - If you are unsure about any treatment, say: "Consult your local Krishi Vigyan Kendra (KVK)"
                    - Only recommend well-known generic treatments: neem oil, copper fungicide, crop rotation, proper drainage
                    - Always mention cheapest organic solution first, then general chemical category
                    - If an image is provided, analyze it for diseases and pests first
                    """.formatted(language, safeCrop);

            String conversationId = (userId != null && !userId.isBlank()) ? userId : "anonymous";

            // For now, Groq doesn't support vision, so we'll handle text-only queries
            // If image is provided, we'll mention it in the prompt but not send the image
            if (imageBase64 != null && !imageBase64.isBlank()) {
                log.info("Image provided but Groq doesn't support vision yet. Analyzing text query with image context.");
                safeQuestion = safeQuestion + " [User has provided an image of the crop for analysis]";
            }

            // Build Groq API request
            Map<String, Object> requestBody = Map.of(
                "model", groqModel,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", safeQuestion)
                ),
                "temperature", 0.3,
                "max_tokens", 200
            );

            log.debug("[GROQ] Sending chat request for question: {}... | model={}", 
                    safeQuestion.length() > 50 ? safeQuestion.substring(0, 50) + "..." : safeQuestion, groqModel);
            
            long apiCallStart = System.currentTimeMillis();
            String response = webClient.post()
                    .uri("https://api.groq.com/openai/v1/chat/completions")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(45))
                    .onErrorMap(e -> {
                        long duration = System.currentTimeMillis() - apiCallStart;
                        String errorType = e.getClass().getSimpleName();
                        // Extract actual response body from WebClient errors
                        String responseBody = "";
                        if (e instanceof WebClientResponseException wcre) {
                            responseBody = wcre.getResponseBodyAsString();
                            log.error("[GROQ] HTTP {} from Groq API after {}ms | Body: {}", 
                                    wcre.getStatusCode().value(), duration, responseBody);
                        }
                        log.error("[GROQ] API call failed with {} after {}ms: {}", 
                                errorType, duration, e.getMessage());
                        return new RuntimeException(
                                "Groq API error (" + errorType + " after " + duration + "ms): " + e.getMessage(), e);
                    })
                    .block();

            long apiDuration = System.currentTimeMillis() - apiCallStart;
            if (response == null || response.isBlank()) {
                throw new RuntimeException("Groq returned empty response after " + apiDuration + "ms");
            }

            log.info("[GROQ] Chat request completed in {}ms | Total time: {}ms | Response: {}chars",
                    apiDuration, System.currentTimeMillis() - startedAt, response.length());

            // Parse Groq response
            JsonNode root = objectMapper.readTree(response);
            if (root.has("error")) {
                String errorMsg = root.get("error").get("message").asText();
                throw new RuntimeException("Groq API returned error: " + errorMsg);
            }

            String content = root.get("choices").get(0).get("message").get("content").asText();
            log.debug("[GROQ] Extracted response: {}chars", content.length());
            return content;

        } catch (Exception e) {
            long totalTime = System.currentTimeMillis() - startedAt;
            String errorType = e.getClass().getSimpleName();
            String errorMsg = e.getMessage() != null ? e.getMessage() : "No message";
            log.error("[GROQ] ❌ CHAT FAILED after {}ms | Type: {} | Message: {} | Cause: {}", 
                    totalTime, errorType, errorMsg, 
                    e.getCause() != null ? e.getCause().getClass().getSimpleName() + ": " + e.getCause().getMessage() : "none");
            
            // Classify the error for better diagnostics
            if (errorMsg.contains("401") || errorMsg.contains("Unauthorized") || errorMsg.contains("invalid_api_key")) {
                log.error("[GROQ] 🔑 API KEY ISSUE — Groq returned 401. Check GROQ_API_KEY on Render.");
            } else if (errorMsg.contains("timeout") || errorMsg.contains("Timeout")) {
                log.error("[GROQ] ⏱️ TIMEOUT — Groq API did not respond within deadline.");
            } else if (errorMsg.contains("Connection") || errorMsg.contains("resolve")) {
                log.error("[GROQ] 🌐 NETWORK — Cannot reach api.groq.com from this environment.");
            }
            
            return "Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.";
        }
    }

    // Keep generateTreatmentPlan as is
    public String generateTreatmentPlan(DetectionResult result, String langCode) {
        long startedAt = System.currentTimeMillis();
        try {
            String language = safeLanguageName(langCode);
            String treatmentList = String.join(", ", result.getOrganicTreatment());

            String planPrompt = """
                    Create a practical 7-day treatment plan in %s for a farmer \
                    dealing with %s with %s severity.
                    Available treatments: %s.
                    Format exactly as:
                    Day 1: [specific action]
                    Day 2: [specific action]
                    Day 3: [specific action]
                    Day 4: [specific action]
                    Day 5: [specific action]
                    Day 6: [specific action]
                    Day 7: [specific action]
                    Keep each day instruction under 20 words.
                    Use simple farmer-friendly language.
                    """.formatted(language, result.getDiseaseName(),
                    result.getSeverity(), treatmentList);
            
            // Build Groq API request for treatment plan
            Map<String, Object> requestBody = Map.of(
                "model", groqModel,
                "messages", List.of(
                    Map.of("role", "system", "content", "You are KrishiGPT, an expert Indian agricultural scientist."),
                    Map.of("role", "user", "content", planPrompt)
                ),
                "temperature", 0.2,
                "max_tokens", 300
            );

            String response = webClient.post()
                    .uri("https://api.groq.com/openai/v1/chat/completions")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(45))
                    .block();

            if (response == null || response.isBlank()) {
                throw new RuntimeException("Groq returned empty response for treatment plan");
            }

                log.info("Groq treatment plan request completed durationMs={}", System.currentTimeMillis() - startedAt);

            // Parse Groq response
            JsonNode root = objectMapper.readTree(response);
            if (root.has("error")) {
                String errorMsg = root.get("error").get("message").asText();
                throw new RuntimeException("Groq API error: " + errorMsg);
            }

            String content = root.get("choices").get(0).get("message").get("content").asText();
            return content;

        } catch (Exception e) {
            log.error("Treatment plan generation failed: {}", e.getMessage(), e);
            return """
                    Day 1: Inspect all plants and remove severely infected parts
                    Day 2: Apply neem oil 5ml per litre on all affected plants
                    Day 3: Improve drainage and air circulation in field
                    Day 4: Apply recommended fungicide as per dosage
                    Day 5: Monitor plants for improvement or spread
                    Day 6: Repeat neem oil spray on remaining infections
                    Day 7: Evaluate results and plan next spray schedule
                    """;
        }
    }
}
