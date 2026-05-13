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

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.time.Duration;

/**
 * KrishiGPT — AI farming assistant with real multimodal support.
 * Text queries → Groq Llama 3.1 (fast, conversational)
 * Image queries → Gemini Vision (analysis) → Groq (conversational response)
 */
@Service
@Slf4j
public class KrishiGPTService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final DiseaseDetectionService diseaseDetectionService;
    private final com.farmsense.repository.ChatHistoryRepository chatHistoryRepository;

    @Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    @Value("${app.ai.groq-model:llama-3.1-8b-instant}")
    private String groqModel;

    public KrishiGPTService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper,
                            DiseaseDetectionService diseaseDetectionService,
                            com.farmsense.repository.ChatHistoryRepository chatHistoryRepository) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.diseaseDetectionService = diseaseDetectionService;
        this.chatHistoryRepository = chatHistoryRepository;
    }

    @jakarta.annotation.PostConstruct
    void logStartupDiagnostics() {
        boolean groqKeyPresent = groqApiKey != null && !groqApiKey.trim().isEmpty();
        log.info("═══════════════════════════════════════════════════════════");
        log.info("  KrishiGPT Service INITIALIZED");
        log.info("  Groq API Key configured: {} (length={})", groqKeyPresent,
                groqApiKey != null ? groqApiKey.trim().length() : 0);
        log.info("  Groq Model: {}", groqModel);
        log.info("  Multimodal: Gemini Vision → Groq pipeline active");
        log.info("═══════════════════════════════════════════════════════════");
        if (!groqKeyPresent) {
            log.error("GROQ_API_KEY IS NOT SET! KrishiGPT will fail for all requests.");
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

    // ═════════════════════════════════════════════════════════════════════════════
    // MAIN CHAT ENDPOINT — handles text-only AND image+text queries
    // ═════════════════════════════════════════════════════════════════════════════

    public String askKrishiGPT(String userId, String question, String crop, String langCode, String imageBase64) {
        long startedAt = System.currentTimeMillis();
        log.info("[CHAT] Request — crop={}, lang={}, hasImage={}, user={}",
                crop, langCode, imageBase64 != null && !imageBase64.isBlank(), userId);

        try {
            String language = safeLanguageName(langCode);
            String safeCrop = (crop == null || crop.isBlank()) ? "general" : crop;
            String safeQuestion = (question == null || question.isBlank())
                    ? "Share practical crop care advice for this week."
                    : question;

            // ── MULTIMODAL: If image is provided, analyze it with Gemini Vision first ──
            String imageContext = null;
            if (imageBase64 != null && !imageBase64.isBlank()) {
                log.info("[CHAT] Image provided — routing to Gemini Vision for analysis");
                imageContext = analyzeImageWithGemini(imageBase64, safeCrop);
                if (imageContext != null) {
                    log.info("[CHAT] Gemini Vision analysis complete: {}chars", imageContext.length());
                } else {
                    log.warn("[CHAT] Gemini Vision analysis returned null — proceeding with text-only");
                }
            }

            // ── Fetch Conversation Memory ──
            List<com.farmsense.model.entity.ChatHistory> history = new ArrayList<>();
            if (userId != null) {
                history = chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
            }
            
            // ── Build system prompt ──
            String systemPrompt = buildSystemPrompt(language, safeCrop, imageContext);

            // ── Build user message with history context ──
            StringBuilder userContext = new StringBuilder();
            if (!history.isEmpty()) {
                userContext.append("PREVIOUS CHAT HISTORY (for context):\n");
                for (int i = Math.min(2, history.size() - 1); i >= 0; i--) {
                    userContext.append("Farmer: ").append(history.get(i).getQuestion()).append("\n");
                    userContext.append("KrishiGPT: ").append(history.get(i).getAnswer()).append("\n\n");
                }
            }

            if (imageContext != null) {
                userContext.append("IMAGE ANALYSIS CONTEXT:\n").append(imageContext).append("\n\n");
            }
            userContext.append("FARMER's CURRENT QUESTION: ").append(safeQuestion);

            // ── Call Groq ──
            return callGroq(systemPrompt, userContext.toString(), startedAt);

        } catch (Exception e) {
            long totalTime = System.currentTimeMillis() - startedAt;
            log.error("[CHAT] Failed after {}ms: {} — {}", totalTime,
                    e.getClass().getSimpleName(), e.getMessage());
            return "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // REAL IMAGE ANALYSIS — Gemini Vision
    // ═════════════════════════════════════════════════════════════════════════════

    private String analyzeImageWithGemini(String imageBase64, String crop) {
        try {
            // Strip data URL prefix if present
            String cleanBase64 = imageBase64;
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.getDecoder().decode(cleanBase64);
            return diseaseDetectionService.analyzeImageForChat(imageBytes, crop);

        } catch (Exception e) {
            log.warn("[CHAT] Image decode/analysis failed: {}", e.getMessage());
            return null;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // SYSTEM PROMPT — crop-aware, image-context-aware, non-repetitive
    // ═════════════════════════════════════════════════════════════════════════════

    private String buildSystemPrompt(String language, String crop, String imageContext) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                You are KrishiGPT, a senior Indian agricultural scientist with deep expertise \
                in crop pathology, soil science, integrated pest management, and organic farming.
                
                RESPONSE RULES:
                - Respond ONLY in %s language
                - Keep responses under 200 words — be concise but expert
                - Use simple language a farmer with basic education can understand
                - Be specific to %s cultivation in Indian conditions
                - AVOID repeating generic phrases like "consult KVK", "neem oil", "crop rotation", or "proper drainage" unless directly relevant
                - Do NOT give generic templates. Offer tailored, crop-specific advice
                - If the farmer's question lacks detail (or image quality is poor), ask CONTEXTUAL follow-up questions (e.g., leaf age, irrigation pattern, weather conditions)
                """.formatted(language, crop));

        sb.append("""
                
                TREATMENT GUIDELINES:
                - Start with the most effective, accessible solution
                - Include specific dosages (e.g., "2ml per litre") and spray intervals
                - If uncertain, ask clarifying questions instead of guessing
                
                SAFETY RULES:
                - NEVER invent chemical or brand names
                - NEVER guarantee crop recovery
                - Avoid assuming diseases without visual/textual evidence
                """);

        if (imageContext != null) {
            sb.append("""
                    
                    IMAGE ANALYSIS:
                    The farmer has shared a crop image. Gemini Vision has analyzed it and found:
                    %s
                    
                    Use this analysis to answer the farmer's question about their crop.
                    Reference specific symptoms visible in the image.
                    """.formatted(imageContext));
        }

        return sb.toString();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // GROQ API CALL
    // ═════════════════════════════════════════════════════════════════════════════

    private String callGroq(String systemPrompt, String userMessage, long startedAt) throws Exception {
        Map<String, Object> requestBody = Map.of(
            "model", groqModel,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
            ),
            "temperature", 0.4,
            "max_tokens", 400
        );

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
                    if (e instanceof WebClientResponseException wcre) {
                        int status = wcre.getStatusCode().value();
                        log.error("[GROQ] HTTP {} after {}ms | Body: {}", status, duration, wcre.getResponseBodyAsString());
                        if (status == 429) return new RuntimeException("AI_QUOTA_EXCEEDED: Groq API rate limit or quota exceeded.");
                        if (status == 401 || status == 403) return new RuntimeException("AI_AUTH_FAILURE: Invalid Groq API key.");
                        if (status >= 500) return new RuntimeException("AI_UPSTREAM_OUTAGE: Groq API is currently down.");
                    } else if (e instanceof java.util.concurrent.TimeoutException) {
                        log.error("[GROQ] Timeout after {}ms", duration);
                        return new RuntimeException("AI_TIMEOUT: Groq API took too long to respond.");
                    }
                    log.error("[GROQ] Failed with {} after {}ms: {}", e.getClass().getSimpleName(), duration, e.getMessage());
                    return new RuntimeException("AI_UNKNOWN_ERROR: " + e.getMessage(), e);
                })
                .block();

        if (response == null || response.isBlank()) {
            throw new RuntimeException("Groq returned empty response");
        }

        log.info("[GROQ] Completed in {}ms (total={}ms)",
                System.currentTimeMillis() - apiCallStart, System.currentTimeMillis() - startedAt);

        JsonNode root = objectMapper.readTree(response);
        if (root.has("error")) {
            throw new RuntimeException("Groq error: " + root.path("error").path("message").asText());
        }

        return root.path("choices").get(0).path("message").path("content").asText();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // TREATMENT PLAN GENERATION
    // ═════════════════════════════════════════════════════════════════════════════

    public String generateTreatmentPlan(DetectionResult result, String langCode) {
        long startedAt = System.currentTimeMillis();
        try {
            String language = safeLanguageName(langCode);

            String organicList = result.getOrganicTreatment() != null
                    ? String.join(", ", result.getOrganicTreatment()) : "consult expert";
            String chemicalList = result.getChemicalTreatment() != null
                    ? String.join(", ", result.getChemicalTreatment()) : "consult expert";

            String planPrompt = """
                    Create a specific, actionable 7-day treatment plan in %s for a farmer \
                    dealing with %s (%s severity) in their %s crop.
                    
                    Available organic treatments: %s
                    Available chemical treatments: %s
                    Spray interval: %s
                    Best treatment time: %s
                    
                    Format EXACTLY as:
                    Day 1: [specific action with dosage/timing]
                    Day 2: [specific action]
                    Day 3: [specific action]
                    Day 4: [specific action]
                    Day 5: [specific action]
                    Day 6: [specific action]
                    Day 7: [evaluation and next steps]
                    
                    RULES:
                    - Each day must be different — no repeated actions
                    - Include specific dosages and timing
                    - Include monitoring/inspection days
                    - Keep each day instruction under 25 words
                    - Be practical for a small Indian farmer
                    """.formatted(language, result.getDiseaseName(),
                    result.getSeverity(), result.getCropName(),
                    organicList, chemicalList,
                    result.getSprayInterval() != null ? result.getSprayInterval() : "as needed",
                    result.getBestTimeToTreat() != null ? result.getBestTimeToTreat() : "early morning");

            String systemPrompt = "You are KrishiGPT, a senior Indian agricultural scientist creating " +
                    "a practical treatment plan. Be specific, actionable, and realistic.";

            return callGroq(systemPrompt, planPrompt, startedAt);

        } catch (Exception e) {
            log.error("[PLAN] Generation failed: {}", e.getMessage());
            // Return a disease-specific fallback instead of generic neem oil plan
            return buildMinimalPlan(result);
        }
    }

    /**
     * Minimal fallback plan that uses actual detection data instead of generic advice.
     */
    private String buildMinimalPlan(DetectionResult result) {
        String disease = result.getDiseaseName() != null ? result.getDiseaseName() : "the detected condition";
        String organic = result.getOrganicTreatment() != null && !result.getOrganicTreatment().isEmpty()
                ? result.getOrganicTreatment().get(0) : "consult your local KVK for organic options";
        String chemical = result.getChemicalTreatment() != null && !result.getChemicalTreatment().isEmpty()
                ? result.getChemicalTreatment().get(0) : "consult your local KVK for chemical options";

        return """
                Day 1: Inspect all plants carefully. Remove and destroy severely infected parts of %s
                Day 2: Apply organic treatment — %s
                Day 3: Improve field drainage and air circulation. Monitor spread
                Day 4: Apply chemical treatment if organic is insufficient — %s
                Day 5: Monitor plants for improvement. Check neighboring plants
                Day 6: Re-apply treatment if symptoms persist. Adjust irrigation
                Day 7: Evaluate recovery progress. Plan next treatment cycle if needed
                """.formatted(disease, organic, chemical);
    }
}
