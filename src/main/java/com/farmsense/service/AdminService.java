package com.farmsense.service;

import com.farmsense.model.entity.SystemConfig;
import com.farmsense.model.entity.User;
import com.farmsense.model.entity.UserActivity;
import com.farmsense.repository.ChatHistoryRepository;
import com.farmsense.repository.ReportRepository;
import com.farmsense.repository.SystemConfigRepository;
import com.farmsense.repository.UserActivityRepository;
import com.farmsense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ChatHistoryRepository chatRepository;
    private final SystemConfigRepository configRepository;
    private final UserActivityRepository activityRepository;
    private final WebClient.Builder webClientBuilder;

    public List<User> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public User toggleUserEnabled(String userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(enabled);
        log.info("Admin {} user: {}", enabled ? "enabled" : "disabled", user.getEmail());
        return userRepository.save(user);
    }

    public void softDeleteUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(false);
        log.info("Admin soft-deleted user: {}", user.getEmail());
        userRepository.save(user);
    }

    public List<User> getAgronomists() {
        return userRepository.findByRole("ROLE_AGRONOMIST");
    }

    public Map<String, Object> getSystemStats() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        long totalUsers = userRepository.count();
        long scansToday = reportRepository.countByCreatedAtAfter(startOfDay);
        long chatsToday = chatRepository.countByCreatedAtAfter(startOfDay);
        long activeUsers = userRepository.countByLastLoginAtAfter(sevenDaysAgo);

        String mostCommonDisease = reportRepository.findMostCommonDiseaseAfter(sevenDaysAgo);
        List<String> topCrops = reportRepository.findTop5Crops();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("scansToday", scansToday);
        stats.put("chatsToday", chatsToday);
        stats.put("activeUsers7Days", activeUsers);
        stats.put("mostCommonDisease", mostCommonDisease != null ? mostCommonDisease : "None");
        stats.put("topCrops", topCrops);

        return stats;
    }

    public List<UserActivity> getRecentActivities(int limit) {
        return activityRepository.findAll(PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
    }

    public Map<String, Object> getHealthStatus() {
        Map<String, Object> health = new HashMap<>();
        
        // Database check
        try {
            userRepository.count();
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
        }

        // Ollama check
        try {
            String ollamaUrl = "http://localhost:11434/api/tags";
            webClientBuilder.build().get().uri(ollamaUrl).retrieve().toBodilessEntity().block();
            health.put("ollama", "UP");
        } catch (Exception e) {
            health.put("ollama", "DOWN");
        }

        health.put("timestamp", LocalDateTime.now());
        return health;
    }

    public SystemConfig updateConfig(String key, String value, String adminId) {
        SystemConfig config = configRepository.findByConfigKey(key)
                .orElseGet(() -> SystemConfig.builder().configKey(key).build());
        config.setConfigValue(value);
        config.setUpdatedBy(adminId);
        log.info("Admin {} updated config: {} = {}", adminId, key, value);
        return configRepository.save(config);
    }
}
