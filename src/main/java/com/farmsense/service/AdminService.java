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
import java.time.Duration;
import java.time.Instant;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private static final Instant START_TIME = Instant.now();

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

    @org.springframework.beans.factory.annotation.Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @org.springframework.beans.factory.annotation.Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    public Map<String, Object> getHealthStatus() {
        Map<String, Object> health = new HashMap<>();
        
        // Database check
        try {
            userRepository.count();
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
        }

        // Gemini check
        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models?key=" + geminiApiKey))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            health.put("gemini", resp.statusCode() == 200 ? "UP" : "DOWN");
        } catch (HttpTimeoutException e) {
            health.put("gemini", "TIMEOUT");
        } catch (Exception e) {
            health.put("gemini", "DOWN");
        }

        // Groq check
        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/models"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .GET()
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            health.put("groq", resp.statusCode() == 200 ? "UP" : "DOWN");
        } catch (HttpTimeoutException e) {
            health.put("groq", "TIMEOUT");
        } catch (Exception e) {
            health.put("groq", "DOWN");
        }

        Duration uptime = Duration.between(START_TIME, Instant.now());
        health.put("uptimeSeconds", uptime.toSeconds());
        health.put("uptimeHuman", String.format("%dh %02dm %02ds", uptime.toHours(), uptime.toMinutesPart(), uptime.toSecondsPart()));

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
