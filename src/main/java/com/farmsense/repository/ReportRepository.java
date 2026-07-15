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

    List<DetectionReport> findByFarmerIdAndIsBookmarkedTrueOrderByCreatedAtDesc(String farmerId);

    Long countByCreatedAtAfter(java.time.LocalDateTime date);

    @org.springframework.data.jpa.repository.Query("SELECT r.diseaseName FROM DetectionReport r WHERE r.createdAt > :date GROUP BY r.diseaseName ORDER BY COUNT(r) DESC LIMIT 1")
    String findMostCommonDiseaseAfter(@org.springframework.data.repository.query.Param("date") java.time.LocalDateTime date);

    @org.springframework.data.jpa.repository.Query("SELECT r.cropName FROM DetectionReport r GROUP BY r.cropName ORDER BY COUNT(r) DESC LIMIT 5")
    List<String> findTop5Crops();

    @org.springframework.data.jpa.repository.Query("SELECT r.diseaseName, COUNT(r) FROM DetectionReport r WHERE r.createdAt > :date GROUP BY r.diseaseName ORDER BY COUNT(r) DESC")
    List<Object[]> findDiseaseTrendsAfter(@org.springframework.data.repository.query.Param("date") java.time.LocalDateTime date);

    List<DetectionReport> findByVerifiedFalseOrderByCreatedAtDesc();

    List<DetectionReport> findByCreatedAtAfterAndIsHealthyFalse(java.time.LocalDateTime date);
}
