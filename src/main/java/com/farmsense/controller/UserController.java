package com.farmsense.controller;

import com.farmsense.service.ActivityService;
import com.farmsense.service.ReportService;
import com.farmsense.service.UserStatsService;
import com.farmsense.repository.ChatHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserStatsService userStatsService;
    private final ActivityService activityService;
    private final ReportService reportService;
    private final ChatHistoryRepository chatHistoryRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(userStatsService.getUserStats(userId));
    }

    @GetMapping("/activities")
    public ResponseEntity<?> getActivities(HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(activityService.getUserActivities(userId, page));
    }

    @GetMapping("/activities/recent")
    public ResponseEntity<?> getRecentActivities(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(activityService.getRecentActivities(userId));
    }

    @GetMapping("/chat-history")
    public ResponseEntity<?> getChatHistory(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/scan-history")
    public ResponseEntity<?> getScanHistory(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(reportService.getHistory(userId));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        String email = (String) request.getAttribute("userEmail");
        String name = (String) request.getAttribute("userName");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "email", email != null ? email : "",
                "fullName", name != null ? name : ""));
    }
}
