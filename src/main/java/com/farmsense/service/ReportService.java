package com.farmsense.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmsense.model.dto.DetectionResult;
import com.farmsense.model.entity.DetectionReport;
import com.farmsense.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final ObjectMapper objectMapper;

    public void saveReport(DetectionResult result, String farmerId, String crop, String language) {
        try {
            String organicJson = objectMapper.writeValueAsString(result.getOrganicTreatment());
            String chemicalJson = objectMapper.writeValueAsString(result.getChemicalTreatment());
            String preventiveJson = objectMapper.writeValueAsString(result.getPreventiveMeasures());

            boolean isHealthyScan = result.isHealthy() ||
                    "healthy".equalsIgnoreCase(result.getDiseaseName()) ||
                    "no disease".equalsIgnoreCase(result.getDiseaseName()) ||
                    (result.getDiseaseName() != null && result.getDiseaseName().toLowerCase().contains("not a recognizable"));

            DetectionReport report = DetectionReport.builder()
                    .farmerId(farmerId)
                    .cropName(crop)
                    .diseaseName(result.getDiseaseName())
                    .confidence(result.getConfidence())
                    .severity(result.getSeverity())
                    .yieldLossEstimate(result.getYieldLossEstimate())
                    .language(language)
                    .organicTreatment(organicJson)
                    .chemicalTreatment(chemicalJson)
                    .preventiveMeasures(preventiveJson)
                    .bestTimeToTreat(result.getBestTimeToTreat())
                    .estimatedRecoveryCost(result.getEstimatedRecoveryCost())
                    .urgencyLevel(result.getUrgencyLevel())
                    .isHealthy(isHealthyScan)
                    .build();

            reportRepository.save(report);
            log.info("Report saved for farmer {} - Disease: {}", farmerId, result.getDiseaseName());

        } catch (Exception e) {
            log.error("Failed to save report for farmer {}: {}", farmerId, e.getMessage(), e);
        }
    }

    public List<DetectionReport> getHistory(String farmerId) {
        try {
            return reportRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        } catch (Exception e) {
            log.error("Failed to fetch history for farmer {}: {}", farmerId, e.getMessage());
            return List.of();
        }
    }

    public Map<String, Object> getStats(String farmerId) {
        try {
            List<DetectionReport> history = reportRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
            Long totalScans = reportRepository.countByFarmerId(farmerId);
            Optional<DetectionReport> lastScan = reportRepository.findTopByFarmerIdOrderByCreatedAtDesc(farmerId);

            String mostCommonDisease = history.stream()
                    .collect(Collectors.groupingBy(DetectionReport::getDiseaseName, Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("None");

            double avgConfidence = history.stream()
                    .filter(r -> r.getConfidence() != null)
                    .mapToInt(DetectionReport::getConfidence)
                    .average()
                    .orElse(0.0);

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalScans", totalScans);
            stats.put("mostCommonDisease", mostCommonDisease);
            stats.put("avgConfidence", Math.round(avgConfidence));
            stats.put("lastScanDate", lastScan.map(DetectionReport::getCreatedAt).orElse(null));
            return stats;

        } catch (Exception e) {
            log.error("Failed to compute stats for farmer {}: {}", farmerId, e.getMessage());
            return Map.of("totalScans", 0L, "mostCommonDisease", "None",
                    "avgConfidence", 0L, "lastScanDate", "N/A");
        }
    }
}
