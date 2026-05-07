package com.farmsense.service;

import com.farmsense.model.dto.DetectionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.Media;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class KrishiGPTService {

    private final ChatClient chatClient;
    private final ChatClient visionChatClient;
    private final ChatMemory chatMemory;

    public KrishiGPTService(
            @Qualifier("chatChatClient") ChatClient chatClient,
            @Qualifier("visionChatClient") ChatClient visionChatClient,
            ChatMemory chatMemory) {
        this.chatClient = chatClient;
        this.visionChatClient = visionChatClient;
        this.chatMemory = chatMemory;
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

            if (imageBase64 != null && !imageBase64.isBlank()) {
                log.info("Multimodal chat request with image from user: {}", userId);
                byte[] imageBytes = Base64.getDecoder().decode(imageBase64.contains(",") ? imageBase64.split(",")[1] : imageBase64);
                
                var media = new Media(MimeTypeUtils.IMAGE_JPEG, new ByteArrayResource(imageBytes));
                var userMessage = new UserMessage(safeQuestion, List.of(media));

                return visionChatClient.prompt(new Prompt(List.of(userMessage)))
                        .system(systemPrompt)
                        .advisors(new MessageChatMemoryAdvisor(chatMemory, conversationId, 10))
                        .call()
                        .content();
            }

            return chatClient.prompt()
                    .system(systemPrompt)
                    .user(safeQuestion)
                    .advisors(new MessageChatMemoryAdvisor(chatMemory, conversationId, 10))
                    .call()
                    .content();

        } catch (Exception e) {
            log.error("KrishiGPT failed: {}", e.getMessage(), e);
            return "I am sorry, I could not process your question right now. " +
                    "Please try again in a few moments. Meanwhile, consult your local " +
                    "Krishi Vigyan Kendra (KVK) for immediate help.";
        }
    }

    // Keep generateTreatmentPlan as is
    public String generateTreatmentPlan(DetectionResult result, String langCode) {
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

            return chatClient.prompt()
                    .system("You are KrishiGPT, an expert Indian agricultural scientist.")
                    .user(planPrompt)
                    .call()
                    .content();

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
