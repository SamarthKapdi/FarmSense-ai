package com.farmsense.repository;

import com.farmsense.model.entity.OutbreakAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutbreakAlertRepository extends JpaRepository<OutbreakAlert, String> {
    List<OutbreakAlert> findByActiveTrueOrderByCreatedAtDesc();
    List<OutbreakAlert> findByRegionAndActiveTrueOrderByCreatedAtDesc(String region);
}
