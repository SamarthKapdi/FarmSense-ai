package com.farmsense.repository;

import com.farmsense.model.entity.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, String> {
    List<ChatHistory> findByUserIdOrderByCreatedAtDesc(String userId);

    List<ChatHistory> findByUserIdAndCrop(String userId, String crop);

    Long countByUserId(String userId);
}
