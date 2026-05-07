package com.farmsense.service;

import com.farmsense.model.Notification;
import com.farmsense.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SseService sseService;

    /**
     * Send a notification to a specific user + push via SSE.
     */
    public Notification send(String userId, String type, String title, String message) {
        return send(userId, type, title, message, null, null);
    }

    /**
     * Send a notification with a reference to a source entity + push via SSE.
     */
    public Notification send(String userId, String type, String title, String message,
                             String referenceType, String referenceId) {
        Notification n = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();
        Notification saved = notificationRepository.save(n);
        log.info("Notification sent to user {}: [{}] {}", userId, type, title);

        // Push live via SSE
        sseService.sendToUser(userId, "notification", Map.of(
                "id", saved.getId(),
                "type", type,
                "title", title,
                "message", message != null ? message : "",
                "createdAt", saved.getCreatedAt().toString()
        ));

        // Broadcast to admin dashboards
        sseService.broadcast("activity", Map.of(
                "event", "NOTIFICATION_SENT",
                "userId", userId,
                "type", type,
                "title", title
        ));

        return saved;
    }

    /**
     * Broadcast a notification to all users (by providing a list of user IDs).
     */
    public void broadcast(List<String> userIds, String type, String title, String message) {
        for (String userId : userIds) {
            send(userId, type, title, message);
        }
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}
