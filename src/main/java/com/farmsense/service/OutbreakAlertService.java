package com.farmsense.service;

import com.farmsense.model.entity.DetectionReport;
import com.farmsense.model.entity.OutbreakAlert;
import com.farmsense.repository.OutbreakAlertRepository;
import com.farmsense.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;
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

    @PostConstruct
    public void cleanupInvalidAlerts() {
        try {
            log.info("Checking and cleaning up invalid outbreak alerts from database...");
            List<OutbreakAlert> allAlerts = alertRepository.findAll();
            List<OutbreakAlert> invalid = allAlerts.stream()
                    .filter(a -> isIgnoredDisease(a.getDisease()))
                    .toList();
            if (!invalid.isEmpty()) {
                alertRepository.deleteAll(invalid);
                log.warn("🚨 Permanently removed {} invalid outbreak alerts (e.g. Healthy / Not a recognizable crop image)", invalid.size());
            }
        } catch (Exception e) {
            log.error("Failed to clean up invalid outbreak alerts on startup: {}", e.getMessage());
        }
    }

    private boolean isIgnoredDisease(String disease) {
        if (disease == null || disease.isBlank()) return true;
        String lower = disease.trim().toLowerCase();
        return lower.equals("healthy") ||
               lower.contains("healthy") ||
               lower.contains("not a recognizable") ||
               lower.equals("no disease") ||
               lower.equals("n/a") ||
               lower.equals("unknown");
    }

    /**
     * Runs every 2 hours to check for disease outbreaks.
     * An outbreak = ≥3 reports of same disease in 48 hours.
     */
    @Scheduled(fixedRate = 7200000, initialDelay = 30000) // every 2 hours, 30s delay on startup
    public void checkForOutbreaks() {
        log.info("Running outbreak detection scan...");

        cleanupInvalidAlerts(); // Ensure clean state before check

        LocalDateTime cutoff = LocalDateTime.now().minusHours(48);
        List<DetectionReport> recentReports = reportRepository.findByCreatedAtAfterAndIsHealthyFalse(cutoff).stream()
                .filter(r -> r.getDiseaseName() != null && !isIgnoredDisease(r.getDiseaseName()))
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
        return alertRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .filter(a -> !isIgnoredDisease(a.getDisease()))
                .toList();
    }

    public List<OutbreakAlert> getAlertsByRegion(String region) {
        return alertRepository.findByRegionAndActiveTrueOrderByCreatedAtDesc(region).stream()
                .filter(a -> !isIgnoredDisease(a.getDisease()))
                .toList();
    }
}
