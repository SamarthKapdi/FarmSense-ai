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
                    // Core identity
                    .diseaseName(translateText(result.getDiseaseName(), targetLang))
                    .scientificName(result.getScientificName()) // Keep Latin name
                    .cropName(result.getCropName())
                    .description(translateText(result.getDescription(), targetLang))
                    // Confidence
                    .confidence(result.getConfidence())
                    .confidenceReasoning(translateText(result.getConfidenceReasoning(), targetLang))
                    // Severity
                    .severity(translateText(result.getSeverity(), targetLang))
                    .urgencyLevel(result.getUrgencyLevel())
                    .progressionSpeed(translateText(result.getProgressionSpeed(), targetLang))
                    .recoverability(translateText(result.getRecoverability(), targetLang))
                    // Spread
                    .spreadRisk(translateText(result.getSpreadRisk(), targetLang))
                    .spreadMechanism(translateText(result.getSpreadMechanism(), targetLang))
                    // Symptoms
                    .symptoms(translateList(result.getSymptoms(), targetLang))
                    // Environmental
                    .environmentalCauses(translateList(result.getEnvironmentalCauses(), targetLang))
                    .weatherImpact(translateText(result.getWeatherImpact(), targetLang))
                    .soilImpact(translateText(result.getSoilImpact(), targetLang))
                    .wateringAdvice(translateText(result.getWateringAdvice(), targetLang))
                    .fertilizerAdvice(translateText(result.getFertilizerAdvice(), targetLang))
                    // Treatments
                    .organicTreatment(translateList(result.getOrganicTreatment(), targetLang))
                    .chemicalTreatment(translateList(result.getChemicalTreatment(), targetLang))
                    .dosage(result.getDosage()) // Keep dosage in original units
                    .sprayInterval(translateText(result.getSprayInterval(), targetLang))
                    .preventiveMeasures(translateList(result.getPreventiveMeasures(), targetLang))
                    .bestTimeToTreat(translateText(result.getBestTimeToTreat(), targetLang))
                    .monitoringAdvice(translateText(result.getMonitoringAdvice(), targetLang))
                    // Economic
                    .yieldLossPercent(result.getYieldLossPercent())
                    .yieldLossEstimate(result.getYieldLossEstimate())
                    .yieldLossReasoning(translateText(result.getYieldLossReasoning(), targetLang))
                    .estimatedRecoveryCost(result.getEstimatedRecoveryCost())
                    // Differential
                    .differentialDiagnosis(result.getDifferentialDiagnosis())
                    // Meta
                    .isHealthy(result.isHealthy())
                    .language(targetLang)
                    .timestamp(result.getTimestamp())
                    .build();

        } catch (Exception e) {
            log.error("Full translation failed, returning original: {}", e.getMessage());
            result.setLanguage(targetLang);
            return result;
        }
    }

    private List<String> translateList(List<String> items, String targetLang) {
        if (items == null || items.isEmpty()) return List.of();
        return items.stream()
                .map(s -> translateText(s, targetLang))
                .collect(Collectors.toList());
    }
}
