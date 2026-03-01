package com.farmsense.service;

import com.farmsense.model.dto.DetectionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TranslationService {

    @Value("${libretranslate.api.url}")
    private String translateUrl;

    private final RestTemplate restTemplate = new RestTemplate();

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

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    translateUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object translatedText = response.getBody().get("translatedText");
                if (translatedText != null) {
                    return translatedText.toString();
                }
            }
            log.debug("Translation returned empty for text: {}", text.substring(0, Math.min(text.length(), 50)));
            return text;

        } catch (ResourceAccessException e) {
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
                    .symptoms(result.getSymptoms().stream()
                            .map(s -> translateText(s, targetLang))
                            .collect(Collectors.toList()))
                    .organicTreatment(result.getOrganicTreatment().stream()
                            .map(s -> translateText(s, targetLang))
                            .collect(Collectors.toList()))
                    .chemicalTreatment(result.getChemicalTreatment().stream()
                            .map(s -> translateText(s, targetLang))
                            .collect(Collectors.toList()))
                    .preventiveMeasures(result.getPreventiveMeasures().stream()
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
