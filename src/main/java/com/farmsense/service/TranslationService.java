package com.farmsense.service;

import com.farmsense.model.dto.DetectionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TranslationService {

    @Value("${libretranslate.api.url}")
    private String translateUrl;

    private final WebClient webClient = WebClient.builder().build();

    public String translateText(String text, String targetLang) {
        if ("en".equals(targetLang) || text == null || text.isBlank()) {
            return text;
        }
        try {
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("q", text);
            requestBody.put("source", "en");
            requestBody.put("target", targetLang);
            requestBody.put("format", "text");

            Map<?, ?> response = webClient.post()
                    .uri(translateUrl)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null) {
                Object translatedText = response.get("translatedText");
                if (translatedText != null) {
                    return translatedText.toString();
                }
            }
            log.debug("Translation returned empty for text: {}", text.substring(0, Math.min(text.length(), 50)));
            return text;

        } catch (WebClientRequestException | ResourceAccessException e) {
            // LibreTranslate is not running — this is expected in dev, log at DEBUG
            log.debug("LibreTranslate not reachable (optional service): {}", e.getMessage());
            return text;
        } catch (Exception e) {
            log.debug("Translation skipped for lang {}: {}. Returning original text.", targetLang, e.getMessage());
            return text;
        }
    }

    public DetectionResult translate(DetectionResult result, String targetLang) {
        if ("en".equals(targetLang) || result == null) {
            return result;
        }

        try {
            return DetectionResult.builder()
                    .diseaseName(translateText(result.getDiseaseName(), targetLang))
                    .affectedCrops(result.getAffectedCrops())
                    .severity(translateText(result.getSeverity(), targetLang))
                    .yieldLossEstimate(result.getYieldLossEstimate())
                        .symptoms((result.getSymptoms() == null ? List.<String>of() : result.getSymptoms()).stream()
                            .map(s -> translateText(s, targetLang))
                            .collect(Collectors.toList()))
                        .organicTreatment((result.getOrganicTreatment() == null ? List.<String>of() : result.getOrganicTreatment()).stream()
                            .map(s -> translateText(s, targetLang))
                            .collect(Collectors.toList()))
                        .chemicalTreatment((result.getChemicalTreatment() == null ? List.<String>of() : result.getChemicalTreatment()).stream()
                            .map(s -> translateText(s, targetLang))
                            .collect(Collectors.toList()))
                        .preventiveMeasures((result.getPreventiveMeasures() == null ? List.<String>of() : result.getPreventiveMeasures()).stream()
                            .map(s -> translateText(s, targetLang))
                            .collect(Collectors.toList()))
                    .bestTimeToTreat(translateText(result.getBestTimeToTreat(), targetLang))
                    .estimatedRecoveryCost(translateText(result.getEstimatedRecoveryCost(), targetLang))
                    .confidence(result.getConfidence())
                    .cropName(result.getCropName())
                    .language(targetLang)
                    .timestamp(result.getTimestamp())
                    .isHealthy(result.isHealthy())
                    .urgencyLevel(result.getUrgencyLevel())
                    .build();

        } catch (Exception e) {
            log.error("Full translation failed, returning original: {}", e.getMessage());
            result.setLanguage(targetLang);
            return result;
        }
    }
}
