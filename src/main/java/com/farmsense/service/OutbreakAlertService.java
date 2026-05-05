package com.farmsense.service;

import com.farmsense.model.entity.DetectionReport;
import com.farmsense.model.entity.OutbreakAlert;
import com.farmsense.repository.OutbreakAlertRepository;
import com.farmsense.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutbreakAlertService {

    private final ReportRepository reportRepository;
    private final OutbreakAlertRepository alertRepository;

    /**
     * Runs every 2 hours to check for disease outbreaks.
     * An outbreak = ≥3 reports of same disease in 48 hours.
     */
    @Scheduled(fixedRate = 7200000, initialDelay = 30000) // every 2 hours, 30s delay on startup
    public void checkForOutbreaks() {
        log.info("Running outbreak detection scan...");

        LocalDateTime cutoff = LocalDateTime.now().minusHours(48);
        List<DetectionReport> recentReports = reportRepository.findAll().stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(cutoff))
                .filter(r -> r.getDiseaseName() != null && !r.isHealthy())
                .toList();

        // Group by disease name
        Map<String, List<DetectionReport>> byDisease = recentReports.stream()
                .collect(Collectors.groupingBy(DetectionReport::getDiseaseName));

        for (Map.Entry<String, List<DetectionReport>> entry : byDisease.entrySet()) {
            String disease = entry.getKey();
            List<DetectionReport> reports = entry.getValue();

            if (reports.size() >= 3) {
                LocalDateTime first = reports.stream()
                        .map(DetectionReport::getCreatedAt)
                        .min(Comparator.naturalOrder())
                        .orElse(LocalDateTime.now());
                LocalDateTime last = reports.stream()
                        .map(DetectionReport::getCreatedAt)
                        .max(Comparator.naturalOrder())
                        .orElse(LocalDateTime.now());

                String severity;
                if (reports.size() >= 10) severity = "HIGH";
                else if (reports.size() >= 5) severity = "MEDIUM";
                else severity = "LOW";

                // Check if an active alert already exists for this disease
                boolean alreadyAlerted = alertRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                        .anyMatch(a -> disease.equals(a.getDisease()));

                if (!alreadyAlerted) {
                    OutbreakAlert alert = OutbreakAlert.builder()
                            .disease(disease)
                            .region("India") // Could be enhanced with location data
                            .reportCount(reports.size())
                            .firstReportedAt(first)
                            .lastReportedAt(last)
                            .severity(severity)
                            .active(true)
                            .build();
                    alertRepository.save(alert);
                    log.warn("🚨 Outbreak alert created: {} — {} reports in 48h", disease, reports.size());
                }
            }
        }
    }

    public List<OutbreakAlert> getActiveAlerts() {
        return alertRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    public List<OutbreakAlert> getAlertsByRegion(String region) {
        return alertRepository.findByRegionAndActiveTrueOrderByCreatedAtDesc(region);
    }
}
