package com.farmsense.service;

import com.farmsense.model.entity.User;
import com.farmsense.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserStatsService {

    private final ReportRepository reportRepository;
    private final ChatHistoryRepository chatHistoryRepository;
    private final UserActivityRepository activityRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getUserStats(String userId) {
        try {
            long totalScans = reportRepository.countByFarmerId(userId);
            long totalChats = chatHistoryRepository.countByUserId(userId);
            long daysActive = 0;
            try {
                daysActive = activityRepository.countDistinctActiveDays(userId);
            } catch (Exception ignored) {
            }

            var reports = reportRepository.findByFarmerIdOrderByCreatedAtDesc(userId);

            long uniqueDiseases = reports.stream()
                    .map(r -> r.getDiseaseName())
                    .distinct()
                    .count();

            long uniqueCrops = reports.stream()
                    .map(r -> r.getCropName())
                    .filter(c -> c != null)
                    .distinct()
                    .count();

            String mostCommonDisease = reports.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            r -> r.getDiseaseName(), java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("None yet");

            String mostScannedCrop = reports.stream()
                    .filter(r -> r.getCropName() != null)
                    .collect(java.util.stream.Collectors.groupingBy(
                            r -> r.getCropName(), java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("None yet");

            var chats = chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
            String favoriteLanguage = chats.stream()
                    .filter(c -> c.getLanguage() != null)
                    .collect(java.util.stream.Collectors.groupingBy(
                            c -> c.getLanguage(), java.util.stream.Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("en");

            String joinedDate = userRepository.findById(userId)
                    .map(u -> u.getCreatedAt() != null ? u.getCreatedAt().toString() : "Unknown")
                    .orElse("Unknown");

            String lastActive = activityRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId)
                    .stream()
                    .findFirst()
                    .map(a -> a.getCreatedAt() != null ? a.getCreatedAt().toString() : "N/A")
                    .orElse("N/A");

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalScans", totalScans);
            stats.put("totalChats", totalChats);
            stats.put("uniqueDiseases", uniqueDiseases);
            stats.put("uniqueCrops", uniqueCrops);
            stats.put("mostCommonDisease", mostCommonDisease);
            stats.put("mostScannedCrop", mostScannedCrop);
            stats.put("favoriteLanguage", favoriteLanguage);
            stats.put("joinedDate", joinedDate);
            stats.put("lastActive", lastActive);
            stats.put("daysActive", daysActive);

            return stats;

        } catch (Exception e) {
            log.error("Stats computation failed for user {}: {}", userId, e.getMessage());
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("totalScans", 0L);
            fallback.put("totalChats", 0L);
            fallback.put("uniqueDiseases", 0L);
            fallback.put("uniqueCrops", 0L);
            fallback.put("mostCommonDisease", "None");
            fallback.put("mostScannedCrop", "None");
            fallback.put("favoriteLanguage", "en");
            fallback.put("joinedDate", "Unknown");
            fallback.put("lastActive", "N/A");
            fallback.put("daysActive", 0L);
            return fallback;
        }
    }
}
