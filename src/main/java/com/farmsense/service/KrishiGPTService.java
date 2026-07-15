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

    private static final Map<String, String> LANGUAGE_NAMES = Map.ofEntries(
            Map.entry("en", "English"),
            Map.entry("hi", "Hindi"),
            Map.entry("ta", "Tamil"),
            Map.entry("te", "Telugu"),
            Map.entry("mr", "Marathi"),
            Map.entry("pa", "Punjabi"),
            Map.entry("gu", "Gujarati"),
            Map.entry("bn", "Bengali"),
            Map.entry("kn", "Kannada"),
            Map.entry("ml", "Malayalam"),
            Map.entry("or", "Odia"),
            Map.entry("ur", "Urdu"),
            Map.entry("as", "Assamese"),
            Map.entry("ks", "Kashmiri"),
            Map.entry("ne", "Nepali"),
            Map.entry("sa", "Sanskrit")
    );

    public static String safeLanguageName(String langCode) {
        if (langCode == null || langCode.isBlank()) return "English";
        String normalized = langCode.toLowerCase().trim();
        if (LANGUAGE_NAMES.containsKey(normalized)) return LANGUAGE_NAMES.get(normalized);
        if (normalized.equals("english") || normalized.startsWith("en-")) return "English";
        if (normalized.equals("hindi") || normalized.startsWith("hi-")) return "Hindi";
        if (normalized.equals("tamil") || normalized.startsWith("ta-")) return "Tamil";
        if (normalized.equals("telugu") || normalized.startsWith("te-")) return "Telugu";
        if (normalized.equals("marathi") || normalized.startsWith("mr-")) return "Marathi";
        if (normalized.equals("punjabi") || normalized.startsWith("pa-")) return "Punjabi";
        if (normalized.equals("gujarati") || normalized.startsWith("gu-")) return "Gujarati";
        if (normalized.equals("bengali") || normalized.startsWith("bn-")) return "Bengali";
        if (normalized.equals("kannada") || normalized.startsWith("kn-")) return "Kannada";
        if (normalized.equals("malayalam") || normalized.startsWith("ml-")) return "Malayalam";
        if (normalized.equals("odia") || normalized.startsWith("or-")) return "Odia";
        if (normalized.equals("urdu") || normalized.startsWith("ur-")) return "Urdu";
        if (normalized.length() > 2) {
            return normalized.substring(0, 1).toUpperCase() + normalized.substring(1);
        }
        return "English";
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
                imageContext = analyzeImageWithGemini(imageBase64, safeCrop, langCode);
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
            userContext.append("FARMER's CURRENT QUESTION: ").append(safeQuestion).append("\n\n");
            userContext.append("[MANDATORY OUTPUT INSTRUCTION]: You MUST write your entire response ONLY and EXCLUSIVELY in ")
                       .append(language).append(" language. Under NO circumstances should you reply in Hindi, Marathi, or any other language when ")
                       .append(language).append(" is requested, even if previous chat history messages were in a different language.");

            // ── Call Groq ──
            int maxTokens = safeQuestion.contains("month-by-month crop calendar") ? 2000 : 800;
            return callGroq(systemPrompt, userContext.toString(), startedAt, maxTokens);

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

    private String analyzeImageWithGemini(String imageBase64, String crop, String langCode) {
        try {
            // Strip data URL prefix if present
            String cleanBase64 = imageBase64;
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.getDecoder().decode(cleanBase64);
            return diseaseDetectionService.analyzeImageForChat(imageBytes, crop, langCode);

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
        String template = """
                MANDATORY LANGUAGE DIRECTIVE: You MUST write your ENTIRE response STRICTLY and EXCLUSIVELY in __LANG__ language. Do NOT write in any other language or script even if previous messages in chat history were in a different language!

                You are KrishiGPT, a senior Indian agricultural scientist and empathetic farm advisor with deep practical expertise \
                in crop pathology, soil science, integrated pest management (IPM), and sustainable organic/chemical agronomy.
                
                RESPONSE & CONVERSATION RULES:
                - MULTILINGUAL CONSISTENCY: Respond STRICTLY in __LANG__ language. Every word, recommendation, and question must be naturally expressed in __LANG__.
                - AGRICULTURAL REALISM: Avoid robotic or template-like answers. Speak like a trusted, experienced local agricultural expert who understands Indian farming realities (monsoons, small landholdings, local markets, KVKs).
                - CONCISE YET THOROUGH: Keep responses under 220 words. Use clear bullet points and practical steps.
                - SPECIFICITY: Provide unique, crop-specific advice tailored for __CROP__. Do NOT use generic phrases or repeated boilerplate instructions.
                - CONTEXT RETENTION & FOLLOW-UPS: Always consider the previous conversation turns and image context. If key diagnostic factors are missing (such as exact plant age/growth stage, recent rainfall/humidity, soil drainage, or fertilizer history), ask 1 or 2 targeted follow-up questions to give better advice.
                """;
        sb.append(template.replace("__LANG__", language != null ? language : "English")
                          .replace("__CROP__", crop != null ? crop : "crop"));

        sb.append("""
                
                TREATMENT GUIDELINES:
                - Prioritize IPM: suggest immediate cultural/mechanical control first, then targeted organic/biological agents, and precise chemical fungicides/insecticides if severity requires it.
                - Include exact dosages (e.g., "2 ml/litre water" or "250 gm/acre") and application intervals.
                - Explain safety precautions (mask, gloves, waiting period before harvest).
                
                SAFETY & REALISM RULES:
                - NEVER hallucinate chemical brand names that don't exist; use standard active ingredients.
                - NEVER guarantee 100% crop recovery; explain realistic prognosis.
                
                FINAL LANGUAGE CHECK: Remember to respond strictly in __LANG__ language!
                """.replace("__LANG__", language != null ? language : "English"));

        if (imageContext != null) {
            sb.append("""
                    
                    IMAGE & DIAGNOSTIC CONTEXT:
                    The farmer uploaded a photo of their __CROP__ crop which was analyzed with Gemini Vision:
                    %s
                    
                    Use this visual diagnostic evidence directly in your conversation. Reference specific symptoms (spots, yellowing, lesions) visible in their crop photo. Remember to reply strictly in __LANG__!
                    """.formatted(imageContext).replace("__CROP__", crop != null ? crop : "crop").replace("__LANG__", language != null ? language : "English"));
        }

        return sb.toString();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // GROQ API CALL
    // ═════════════════════════════════════════════════════════════════════════════

    private String callGroq(String systemPrompt, String userMessage, long startedAt) throws Exception {
        return callGroq(systemPrompt, userMessage, startedAt, 800);
    }

    private String callGroq(String systemPrompt, String userMessage, long startedAt, int maxTokens) throws Exception {
        Map<String, Object> requestBody = Map.of(
            "model", groqModel,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
            ),
            "temperature", 0.4,
            "max_tokens", maxTokens
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

            String planTemplate = """
                    Create a highly customized, unique 7-day agricultural treatment and recovery plan in __LANG__ for a farmer \
                    dealing with __DISEASE__ (Severity: __SEV__, Urgency: __URG__, Progression: __SPEED__, AI Confidence: __CONF__%) in their __CROP__ crop.
                    
                    Environmental & Weather Context: __WEATHER__
                    Available organic treatments: __ORG__
                    Available chemical treatments: __CHEM__
                    Recommended spray interval: __INT__
                    Best application timing: __TIME__
                    
                    Format EXACTLY as follows (all text in __LANG__):
                    Day 1: [Immediate stabilization, isolation, or cultural control action with exact method]
                    Day 2: [Specific organic or biological treatment application with precise dosage/timing]
                    Day 3: [Soil/irrigation/environmental adjustment & symptom monitoring check]
                    Day 4: [Targeted chemical fungicide/pesticide application if organic insufficient, with dosage & safety precautions]
                    Day 5: [Foliar nutrition, biostimulant, or plant immunity boost]
                    Day 6: [Follow-up inspection & second organic application or preventive barrier check]
                    Day 7: [Recovery evaluation, harvest readiness check, and long-term prevention protocol]
                    
                    CRITICAL RULES:
                    - Every single day MUST be unique, realistic, and tailored to __CROP__, __DISEASE__, and __SEV__. Do NOT use generic repetitive templates.
                    - Adjust intensity based on __SEV__ and __URG__ (e.g. if Critical/Immediate, chemical intervention may start earlier).
                    - Keep each day's instruction concise (under 30 words) but packed with exact practical detail.
                    """;
            String planPrompt = planTemplate
                    .replace("__LANG__", language)
                    .replace("__DISEASE__", result.getDiseaseName() != null ? result.getDiseaseName() : "Unknown condition")
                    .replace("__SEV__", result.getSeverity() != null ? result.getSeverity() : "Moderate")
                    .replace("__URG__", result.getUrgencyLevel() != null ? result.getUrgencyLevel() : "MODERATE")
                    .replace("__SPEED__", result.getProgressionSpeed() != null ? result.getProgressionSpeed() : "moderate")
                    .replace("__CONF__", String.valueOf(result.getConfidence()))
                    .replace("__WEATHER__", result.getWeatherImpact() != null ? result.getWeatherImpact() : "Standard Indian seasonal climate")
                    .replace("__CROP__", result.getCropName() != null ? result.getCropName() : "Crop")
                    .replace("__ORG__", organicList)
                    .replace("__CHEM__", chemicalList)
                    .replace("__INT__", result.getSprayInterval() != null ? result.getSprayInterval() : "Every 5-7 days")
                    .replace("__TIME__", result.getBestTimeToTreat() != null ? result.getBestTimeToTreat() : "Early morning or late afternoon");

            String systemPrompt = "You are KrishiGPT, a senior Indian agricultural scientist creating " +
                    "a unique, practical, and tailored 7-day treatment plan in " + language + ". Avoid generic templates.";

            return callGroq(systemPrompt, planPrompt, startedAt, 1000);

        } catch (Exception e) {
            log.error("[PLAN] Generation failed: {}", e.getMessage());
            // Return a disease-specific fallback instead of generic neem oil plan
            return buildMinimalPlan(result, langCode);
        }
    }

    /**
     * Minimal fallback plan that uses actual detection data instead of generic advice.
     */
    private String buildMinimalPlan(DetectionResult result, String langCode) {
        String language = safeLanguageName(langCode);
        String disease = result.getDiseaseName() != null ? result.getDiseaseName() : "the detected condition";
        String organic = result.getOrganicTreatment() != null && !result.getOrganicTreatment().isEmpty()
                ? result.getOrganicTreatment().get(0) : "consult your local KVK for organic options";
        String chemical = result.getChemicalTreatment() != null && !result.getChemicalTreatment().isEmpty()
                ? result.getChemicalTreatment().get(0) : "consult your local KVK for chemical options";

        String template = """
                [Language: __LANG__]
                Day 1: Inspect all plants carefully. Remove and destroy severely infected parts of __DISEASE__
                Day 2: Apply organic treatment — __ORG__
                Day 3: Improve field drainage and air circulation. Monitor spread
                Day 4: Apply chemical treatment if organic is insufficient — __CHEM__
                Day 5: Monitor plants for improvement. Check neighboring plants
                Day 6: Re-apply treatment if symptoms persist. Adjust irrigation
                Day 7: Evaluate recovery progress. Plan next treatment cycle if needed
                """;
        return template
                .replace("__LANG__", language)
                .replace("__DISEASE__", disease)
                .replace("__ORG__", organic)
                .replace("__CHEM__", chemical);
    }
}
