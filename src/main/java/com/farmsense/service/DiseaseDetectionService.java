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

/**
 * Uses Ollama vision for plant disease detection and returns structured results.
 */
@Service
@Slf4j
public class DiseaseDetectionService {

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

    public DetectionResult analyzeImage(byte[] imageBytes, String crop, String language) {
        log.info("Starting disease analysis for crop={}, language={}, imageSize={} bytes",
                crop, language, imageBytes == null ? 0 : imageBytes.length);

        if (imageBytes == null || imageBytes.length == 0) {
            throw new IllegalArgumentException("Image bytes cannot be empty");
        }

        try {
            return analyzeWithVision(imageBytes, crop, language);
        } catch (Exception visionEx) {
            log.error("Vision model failed completely: {}", visionEx.getMessage(), visionEx);
            log.warn("Falling back to chat-based analysis due to vision failure...");
            try {
                return analyzeWithChat(crop, language);
            } catch (Exception chatEx) {
                log.error("Chat model ALSO failed: {}", chatEx.getMessage(), chatEx);
                throw new RuntimeException("AI Analysis failed completely. See logs for details.", chatEx);
            }
        }
    }

    private DetectionResult analyzeWithVision(byte[] imageBytes, String crop, String language) throws Exception {
        String promptText = buildVisionPrompt(crop, language);
        var media = new Media(MimeTypeUtils.IMAGE_JPEG, new ByteArrayResource(imageBytes));
        var userMessage = new UserMessage(promptText, List.of(media));

        log.info("Sending request to Ollama Vision Model...");
        String response = visionChatClient.prompt()
                .messages(userMessage)
                .call()
                .content();

        if (response == null || response.isBlank()) {
            throw new RuntimeException("Vision model returned empty response");
        }

        log.info("RAW Vision AI Response: \n{}", response);

        String json = extractJsonPayload(response);
        log.info("Extracted JSON Payload: \n{}", json);

        DetectionResult result = objectMapper.readValue(json, DetectionResult.class);
        DetectionResult normalized = normalizeResult(result, language);

        log.info("Vision detection completed: crop={} disease={} confidence={} severity={}",
                crop, normalized.getDiseaseName(), normalized.getConfidence(), normalized.getSeverity());
        return normalized;
    }

    private DetectionResult analyzeWithChat(String crop, String language) throws Exception {
        String promptText = buildChatPrompt(crop, language);

        log.info("Sending request to Ollama Chat Model (Fallback)...");
        String response = chatChatClient.prompt()
                .system("You are an expert agricultural pathologist. Always respond with pure JSON only, no markdown.")
                .user(promptText)
                .call()
                .content();

        if (response == null || response.isBlank()) {
            throw new RuntimeException("Chat model returned empty response");
        }

        log.info("RAW Chat AI Response: \n{}", response);

        String json = extractJsonPayload(response);
        log.info("Extracted JSON Payload: \n{}", json);

        DetectionResult result = objectMapper.readValue(json, DetectionResult.class);
        DetectionResult normalized = normalizeResult(result, language);

        log.info("Chat-based detection completed: crop={} disease={} confidence={} severity={}",
                crop, normalized.getDiseaseName(), normalized.getConfidence(), normalized.getSeverity());
        return normalized;
    }

    private String buildVisionPrompt(String crop, String language) {
        return """
                You are a highly skilled plant pathologist AI. Analyze this image of a %s plant.
                Identify any visible crop diseases, pest damage, or nutrient deficiencies.
                If the plant looks completely healthy, indicate that.
                
                Respond in %s language.
                
                You MUST return ONLY a valid JSON object matching the exact structure below. Do not wrap it in markdown block quotes. Do not add any conversational text before or after the JSON.
                
                {
                  "disease": "Exact name of the disease, or 'Healthy' if none",
                  "confidence": 85,
                  "severity": "mild",
                  "description": "Short explanation of visible symptoms",
                  "yieldLossPercent": 15.5,
                  "organic": "Step 1. Step 2. Step 3",
                  "chemical": "Step 1. Step 2. Step 3",
                  "preventive": "Step 1. Step 2"
                }
                
                Rules for the JSON output:
                - "confidence" MUST be an integer between 0 and 100.
                - "severity" MUST be one of: "none", "mild", "moderate", "severe".
                - "yieldLossPercent" MUST be a number (float).
                - For "organic", "chemical", and "preventive", provide steps separated by periods.
                - If "Healthy", set confidence to 100, severity to "none", yieldLossPercent to 0.0, and treatments to "None required."
                """.formatted(crop == null || crop.isBlank() ? "Unknown Crop" : crop, language == null || language.isBlank() ? "English" : language);
    }

    private String buildChatPrompt(String crop, String language) {
        return """
                You are a highly skilled plant pathologist AI. You are analyzing a case for a %s crop in Indian farming conditions.
                Since you cannot see the image, pick the MOST COMMON severe disease that affects %s.
                
                Respond in %s language.
                
                You MUST return ONLY a valid JSON object matching the exact structure below. Do not wrap it in markdown block quotes. Do not add any conversational text before or after the JSON.
                
                {
                  "disease": "Exact name of the disease",
                  "confidence": 75,
                  "severity": "moderate",
                  "description": "Short explanation of typical symptoms",
                  "yieldLossPercent": 25.0,
                  "organic": "Step 1. Step 2",
                  "chemical": "Step 1. Step 2",
                  "preventive": "Step 1. Step 2"
                }
                """.formatted(
                    crop == null || crop.isBlank() ? "Unknown Crop" : crop,
                    crop == null || crop.isBlank() ? "Unknown Crop" : crop,
                    language == null || language.isBlank() ? "English" : language);
    }

    private DetectionResult normalizeResult(DetectionResult result, String language) {
        if (result == null) {
            throw new RuntimeException("Parsed DetectionResult was null");
        }

        String disease = firstNonBlank(result.getDisease(), result.getDiseaseName(), "Unknown Condition");
        double yieldLossPercent = result.getYieldLossPercent();
        boolean healthy = "healthy".equalsIgnoreCase(disease) || "none".equalsIgnoreCase(disease);

        return DetectionResult.builder()
                .disease(disease)
                .yieldLossPercent(healthy ? 0.0 : yieldLossPercent)
                .organic(firstNonBlank(result.getOrganic(), "No organic treatment specified"))
                .chemical(firstNonBlank(result.getChemical(), "No chemical treatment specified"))
                .preventive(firstNonBlank(result.getPreventive(), "No preventive measures specified"))
                .diseaseName(disease)
                .confidence(Math.max(0, result.getConfidence()))
                .severity(firstNonBlank(result.getSeverity(), healthy ? "none" : "moderate").toLowerCase(Locale.ROOT))
                .yieldLossEstimate(String.format(Locale.ROOT, "%.1f%%", healthy ? 0.0 : yieldLossPercent))
                .symptoms(List.of(firstNonBlank(result.getDescription(), "No description provided")))
                .organicTreatment(splitSteps(result.getOrganic()))
                .chemicalTreatment(splitSteps(result.getChemical()))
                .preventiveMeasures(splitSteps(result.getPreventive()))
                .bestTimeToTreat(healthy ? "No treatment needed" : "Immediate action recommended")
                .estimatedRecoveryCost(healthy ? "0" : "Varies based on severity")
                .isHealthy(healthy)
                .urgencyLevel(healthy ? "NONE" : (yieldLossPercent > 20.0 ? "HIGH" : "MONITOR"))
                .language(language == null ? "en" : language)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private String extractJsonPayload(String response) {
        String trimmed = response.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(?:json)?\\s*", "");
            trimmed = trimmed.replaceFirst("\\s*```$", "");
        }

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        
        // Fallback: If it doesn't look like JSON at all, maybe it's just plain text.
        // But we MUST parse it as JSON, so we throw an exception if braces are missing.
        if (start == -1 || end == -1) {
            throw new RuntimeException("No JSON object found in response: " + response);
        }
        
        return trimmed;
    }

    private List<String> splitSteps(String steps) {
        if (steps == null || steps.isBlank()) {
            return List.of("None specified");
        }

        return java.util.Arrays.stream(steps.split("\\r?\\n|;|\\.\\s+"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}