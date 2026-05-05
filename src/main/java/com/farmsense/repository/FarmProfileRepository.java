package com.farmsense.repository;

import com.farmsense.model.entity.FarmProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FarmProfileRepository extends JpaRepository<FarmProfile, String> {

    List<FarmProfile> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<FarmProfile> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);
}
