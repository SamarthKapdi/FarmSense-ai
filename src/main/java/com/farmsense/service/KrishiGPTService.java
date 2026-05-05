package com.farmsense.service;

import com.farmsense.model.dto.DetectionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class KrishiGPTService {

        private final ChatClient chatClient;
        private final ChatMemory chatMemory;

        public KrishiGPTService(@Qualifier("chatChatClient") ChatClient chatClient, ChatMemory chatMemory) {
                this.chatClient = chatClient;
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

        public String askKrishiGPT(String userId, String question, String crop, String langCode) {
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
                                        - Suggest only locally available Indian products and brands
                                        - Keep your response under 150 words maximum
                                        - Use simple language a farmer with basic education understands
                                        - Always mention cheapest solution first then better options
                                        - Current crop context: %s
                                        - Give immediate actionable steps not theoretical advice
                                        """.formatted(language, safeCrop);

                        String conversationId = (userId != null && !userId.isBlank()) ? userId : "anonymous";

                        String response = chatClient.prompt()
                                        .system(systemPrompt)
                                        .user(safeQuestion)
                                        .advisors(new MessageChatMemoryAdvisor(chatMemory, conversationId, 10))
                                        .call()
                                        .content();

                        log.info("KrishiGPT (User: {}) responded in {} for crop {}", conversationId, language, safeCrop);
                        return response;

                } catch (Exception e) {
                        log.error("KrishiGPT failed: {}", e.getMessage(), e);
                        return "I am sorry, I could not process your question right now. " +
                                        "Please try again in a few moments. Meanwhile, consult your local " +
                                        "Krishi Vigyan Kendra (KVK) for immediate help.";
                }
        }

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

                        String response = chatClient.prompt()
                                        .system("You are KrishiGPT, an expert Indian agricultural scientist.")
                                        .user(planPrompt)
                                        .call()
                                        .content();

                        log.info("Treatment plan generated for {} in {}", result.getDiseaseName(), language);
                        return response;

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
