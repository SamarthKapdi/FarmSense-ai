package com.farmsense.service;

import com.farmsense.model.entity.Advisory;
import com.farmsense.model.entity.DetectionReport;
import com.farmsense.repository.AdvisoryRepository;
import com.farmsense.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgronomistService {

    private final ReportRepository reportRepository;
    private final AdvisoryRepository advisoryRepository;
    private final NotificationService notificationService;
    private final SseService sseService;

    public List<Object[]> getDiseaseTrends(int daysBack) {
        LocalDateTime date = LocalDateTime.now().minusDays(daysBack);
        return reportRepository.findDiseaseTrendsAfter(date);
    }

    public List<DetectionReport> getPendingVerifications() {
        return reportRepository.findByVerifiedFalseOrderByCreatedAtDesc();
    }

    public DetectionReport verifyDiagnosis(String reportId, String correctDisease, String notes) {
        DetectionReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        
        report.setVerified(true);
        if (correctDisease != null && !correctDisease.isEmpty()) {
            report.setDiseaseName(correctDisease);
            boolean isHealthyScan = "healthy".equalsIgnoreCase(correctDisease) ||
                    "no disease".equalsIgnoreCase(correctDisease) ||
                    correctDisease.toLowerCase().contains("not a recognizable");
            report.setHealthy(isHealthyScan);
        }
        report.setExpertNotes(notes);
        
        log.info("Agronomist verified report {}", reportId);
        DetectionReport saved = reportRepository.save(report);

        // Push live notification to the farmer
        if (saved.getFarmerId() != null && !saved.getFarmerId().equals("anonymous")) {
            // Need to parse string ID to long if using long IDs in NotificationService, 
            // but assuming string UUID mapped to Long ID or user fetching required. 
            // We'll broadcast admin activity for now
            sseService.broadcast("activity", Map.of(
                "event", "REPORT_VERIFIED",
                "reportId", reportId,
                "disease", saved.getDiseaseName()
            ));
        }

        return saved;
    }

    public Advisory publishAdvisory(Advisory advisory, String authorId) {
        advisory.setAuthorId(authorId);
        log.info("Agronomist {} published advisory: {}", authorId, advisory.getTitle());
        Advisory saved = advisoryRepository.save(advisory);
        
        sseService.broadcast("notification", Map.of(
            "title", "New Advisory: " + saved.getTitle(),
            "message", saved.getContent() != null && saved.getContent().length() > 50 ? saved.getContent().substring(0, 50) + "..." : saved.getContent(),
            "type", "ADVISORY"
        ));
        
        return saved;
    }

    public List<Advisory> getAllAdvisories() {
        return advisoryRepository.findAll();
    }
}
