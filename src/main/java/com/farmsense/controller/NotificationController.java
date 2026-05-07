package com.farmsense.controller;

import com.farmsense.model.Notification;
import com.farmsense.model.entity.User;
import com.farmsense.model.dto.ApiResponse;
import com.farmsense.repository.UserRepository;
import com.farmsense.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUserNotifications(user.getId())));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnread(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "count", notificationService.getUnreadCount(user.getId()),
                "notifications", notificationService.getUnreadNotifications(user.getId())
        )));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok("Marked as read"));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read"));
    }
}
