package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private static final Instant START_TIME = Instant.now();

    private final UserRepository userRepository;

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GROQ_API_KEY:}")
    private String groqApiKey;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        return ResponseEntity.ok(ApiResponse.ok(buildPayload(false)));
    }

    @GetMapping("/ai")
    public ResponseEntity<ApiResponse<Map<String, Object>>> aiHealth() {
        return ResponseEntity.ok(ApiResponse.ok(buildPayload(true)));
    }

    private Map<String, Object> buildPayload(boolean includeAiStack) {
        boolean databaseUp;
        try {
            userRepository.count();
            databaseUp = true;
        } catch (Exception ex) {
            databaseUp = false;
        }

        Duration uptime = Duration.between(START_TIME, Instant.now());
        LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", databaseUp ? "UP" : "DEGRADED");
        payload.put("database", databaseUp ? "UP" : "DOWN");
        payload.put("uptimeSeconds", uptime.toSeconds());
        payload.put("uptimeHuman", formatDuration(uptime));
        payload.put("timestamp", Instant.now().toString());
        payload.put("geminiConfigured", isConfigured(geminiApiKey));
        payload.put("groqConfigured", isConfigured(groqApiKey));

        if (includeAiStack) {
            payload.put("aiStack", Map.of(
                    "vision", "gemini-1.5-flash",
                    "chat", "llama3-8b-8192"
            ));
        }

        return payload;
    }

    private String formatDuration(Duration duration) {
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();
        return String.format("%dh %02dm %02ds", hours, minutes, seconds);
    }

    private boolean isConfigured(String value) {
        return value != null && !value.trim().isEmpty();
    }
}