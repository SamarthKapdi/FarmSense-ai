package com.farmsense.repository;

import com.farmsense.model.entity.DetectionReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<DetectionReport, String> {

    List<DetectionReport> findByFarmerIdOrderByCreatedAtDesc(String farmerId);

    Long countByFarmerId(String farmerId);

    Optional<DetectionReport> findTopByFarmerIdOrderByCreatedAtDesc(String farmerId);
}
