package com.farmsense.repository;

import com.farmsense.model.entity.UserActivity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, String> {
    List<UserActivity> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Long countByUserIdAndActivityType(String userId, String activityType);

    List<UserActivity> findTop10ByUserIdOrderByCreatedAtDesc(String userId);

    @Query("SELECT COUNT(DISTINCT CAST(a.createdAt AS date)) FROM UserActivity a WHERE a.userId = :userId")
    Long countDistinctActiveDays(String userId);

    List<UserActivity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<UserActivity> findByActivityTypeInOrderByCreatedAtDesc(List<String> types, Pageable pageable);
}
