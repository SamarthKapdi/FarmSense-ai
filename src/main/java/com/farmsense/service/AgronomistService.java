package com.farmsense.service;

import com.farmsense.model.entity.Advisory;
import com.farmsense.model.entity.DetectionReport;
import com.farmsense.model.entity.User;
import com.farmsense.model.entity.UserActivity;
import com.farmsense.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
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
    private final UserRepository userRepository;
    private final ChatHistoryRepository chatRepository;
    private final UserActivityRepository activityRepository;
    private final ActivityService activityService;

    public List<Object[]> getDiseaseTrends(int daysBack) {
        LocalDateTime date = LocalDateTime.now().minusDays(daysBack);
        return reportRepository.findDiseaseTrendsAfter(date);
    }

    public List<DetectionReport> getPendingVerifications() {
        return reportRepository.findByVerifiedFalseOrderByCreatedAtDesc();
    }

    public DetectionReport verifyDiagnosis(String reportId, String correctDisease, String notes, String agronomistEmail) {
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
        
        log.info("Agronomist {} verified report {}", agronomistEmail, reportId);
        DetectionReport saved = reportRepository.save(report);

        // Log agronomist activity
        if (agronomistEmail != null) {
            userRepository.findByEmail(agronomistEmail).ifPresent(agronomist -> {
                activityService.logActivity(
                        agronomist.getId(), agronomist.getEmail(), agronomist.getFullName(),
                        "VERIFY_DIAGNOSIS", "Verified diagnosis for scan as: " + saved.getDiseaseName(),
                        "Report ID: " + reportId + ", Confidence: " + saved.getConfidence() + "%"
                );
            });
        }

        // Push live notification to the farmer
        if (saved.getFarmerId() != null && !saved.getFarmerId().equals("anonymous")) {
            sseService.broadcast("activity", Map.of(
                "event", "REPORT_VERIFIED",
                "reportId", reportId,
                "disease", saved.getDiseaseName()
            ));
        }

        return saved;
    }

    public Advisory publishAdvisory(Advisory advisory, String authorEmail) {
        if (authorEmail != null) {
            userRepository.findByEmail(authorEmail).ifPresent(agronomist -> {
                advisory.setAuthorId(agronomist.getId());
                advisory.setAuthorName(agronomist.getFullName());
                
                activityService.logActivity(
                        agronomist.getId(), agronomist.getEmail(), agronomist.getFullName(),
                        "PUBLISH_ADVISORY", "Published crop advisory: " + advisory.getTitle(),
                        "Crop: " + advisory.getCrop() + ", Region: " + advisory.getRegion()
                );
            });
        }
        if (advisory.getAuthorId() == null) {
            advisory.setAuthorId(authorEmail);
            advisory.setAuthorName(authorEmail);
        }

        log.info("Agronomist {} published advisory: {}", authorEmail, advisory.getTitle());
        Advisory saved = advisoryRepository.save(advisory);
        
        String snippet = saved.getContent() == null ? "" : (saved.getContent().length() > 50 ? saved.getContent().substring(0, 50) + "..." : saved.getContent());
        sseService.broadcast("notification", Map.of(
            "title", "New Advisory: " + saved.getTitle(),
            "message", snippet,
            "type", "ADVISORY"
        ));
        
        return saved;
    }

    public List<Advisory> getAllAdvisories() {
        return advisoryRepository.findAllByOrderByCreatedAtDesc();
    }

    public Map<String, Object> getFarmerStats() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        long totalScans = reportRepository.count();
        long scansToday = reportRepository.countByCreatedAtAfter(startOfDay);
        long chatsToday = chatRepository.countByCreatedAtAfter(startOfDay);
        long activeFarmers7Days = userRepository.countByLastLoginAtAfter(sevenDaysAgo);

        return Map.of(
            "totalScans", totalScans,
            "scansToday", scansToday,
            "chatsToday", chatsToday,
            "activeFarmers7Days", activeFarmers7Days
        );
    }

    public List<UserActivity> getUnifiedActivities(String typeFilter, int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit);
        if (typeFilter != null && !typeFilter.isEmpty() && !"ALL".equalsIgnoreCase(typeFilter)) {
            return activityRepository.findByActivityTypeInOrderByCreatedAtDesc(List.of(typeFilter.toUpperCase()), pageRequest);
        }
        return activityRepository.findAllByOrderByCreatedAtDesc(pageRequest);
    }
}
