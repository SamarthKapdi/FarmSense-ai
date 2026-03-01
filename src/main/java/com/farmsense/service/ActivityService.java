package com.farmsense.service;

import com.farmsense.model.entity.UserActivity;
import com.farmsense.repository.UserActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final UserActivityRepository activityRepository;

    @Async
    public void logActivity(String userId, String userEmail, String userName,
            String activityType, String description, String metadata) {
        try {
            UserActivity activity = UserActivity.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .userName(userName)
                    .activityType(activityType)
                    .description(description)
                    .metadata(metadata)
                    .build();
            activityRepository.save(activity);
            log.debug("Activity logged: {} for user {}", activityType, userEmail);
        } catch (Exception e) {
            log.error("Failed to log activity for {}: {}", userEmail, e.getMessage());
        }
    }

    public List<UserActivity> getUserActivities(String userId, int page) {
        return activityRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, 10));
    }

    public List<UserActivity> getRecentActivities(String userId) {
        return activityRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);
    }

    public Long countByType(String userId, String activityType) {
        return activityRepository.countByUserIdAndActivityType(userId, activityType);
    }

    public Long countActiveDays(String userId) {
        try {
            return activityRepository.countDistinctActiveDays(userId);
        } catch (Exception e) {
            log.debug("Active days count failed: {}", e.getMessage());
            return 0L;
        }
    }
}
