package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.entity.User;
import com.farmsense.repository.UserRepository;
import com.farmsense.service.ActivityService;
import com.farmsense.service.ReportService;
import com.farmsense.service.UserStatsService;
import com.farmsense.repository.ChatHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserStatsService userStatsService;
    private final ActivityService activityService;
    private final ReportService reportService;
    private final ChatHistoryRepository chatHistoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(userStatsService.getUserStats(userId)));
    }

    @GetMapping("/activities")
    public ResponseEntity<?> getActivities(HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(activityService.getUserActivities(userId, page)));
    }

    @GetMapping("/activities/recent")
    public ResponseEntity<?> getRecentActivities(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(activityService.getRecentActivities(userId)));
    }

    @GetMapping("/chat-history")
    public ResponseEntity<?> getChatHistory(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId)));
    }

    @GetMapping("/scan-history")
    public ResponseEntity<?> getScanHistory(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(reportService.getHistory(userId)));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));

        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(ApiResponse.error("User not found"));

        User user = opt.get();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "preferredCrop", user.getPreferredCrop() != null ? user.getPreferredCrop() : "Tomato",
                "preferredLanguage", user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en",
                "memberSince", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "",
                "role", user.getRole()
        )));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(HttpServletRequest request,
                                            @RequestBody Map<String, String> body) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));

        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(ApiResponse.error("User not found"));

        User user = opt.get();

        if (body.containsKey("fullName") && !body.get("fullName").isBlank()) {
            user.setFullName(body.get("fullName"));
        }
        if (body.containsKey("preferredCrop")) {
            user.setPreferredCrop(body.get("preferredCrop"));
        }
        if (body.containsKey("preferredLanguage")) {
            user.setPreferredLanguage(body.get("preferredLanguage"));
        }

        userRepository.save(user);
        log.info("Profile updated for user: {}", user.getEmail());

        activityService.logActivity(userId, user.getEmail(), user.getFullName(),
                "PROFILE_UPDATE", "Updated profile settings", null);

        return ResponseEntity.ok(ApiResponse.ok("Profile updated", Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "preferredCrop", user.getPreferredCrop(),
                "preferredLanguage", user.getPreferredLanguage()
        )));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(HttpServletRequest request,
                                             @RequestBody Map<String, String> body) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Both currentPassword and newPassword are required"));
        }
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(ApiResponse.error("New password must be at least 8 characters"));
        }

        Optional<User> opt = userRepository.findById(userId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(ApiResponse.error("User not found"));

        User user = opt.get();
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect"));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getEmail());

        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully"));
    }
}
