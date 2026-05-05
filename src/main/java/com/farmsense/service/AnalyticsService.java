package com.farmsense.service;

import com.farmsense.model.dto.*;
import com.farmsense.model.entity.DetectionReport;
import com.farmsense.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final ReportRepository reportRepository;

    @Cacheable(value = "diseaseBreakdown", key = "#farmerId")
    public List<DiseaseCount> getDiseaseBreakdown(String farmerId) {
        log.debug("Cache MISS: diseaseBreakdown for {}", farmerId);
        List<DetectionReport> reports = reportRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        return reports.stream()
                .filter(r -> r.getDiseaseName() != null)
                .collect(Collectors.groupingBy(DetectionReport::getDiseaseName, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new DiseaseCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(DiseaseCount::getCount).reversed())
                .toList();
    }

    @Cacheable(value = "monthlyTrends", key = "#farmerId")
    public List<MonthlyCount> getMonthlyTrends(String farmerId) {
        log.debug("Cache MISS: monthlyTrends for {}", farmerId);
        List<DetectionReport> reports = reportRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        return reports.stream()
                .filter(r -> r.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getCreatedAt().getYear() * 100 + r.getCreatedAt().getMonthValue(),
                        Collectors.counting()))
                .entrySet().stream()
                .map(e -> new MonthlyCount(e.getKey() % 100, e.getKey() / 100, e.getValue()))
                .sorted(Comparator.comparingInt((MonthlyCount mc) -> mc.getYear() * 100 + mc.getMonth()))
                .toList();
    }

    @Cacheable(value = "cropDistribution", key = "#farmerId")
    public List<CropCount> getCropDistribution(String farmerId) {
        log.debug("Cache MISS: cropDistribution for {}", farmerId);
        List<DetectionReport> reports = reportRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        return reports.stream()
                .filter(r -> r.getCropName() != null)
                .collect(Collectors.groupingBy(DetectionReport::getCropName, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new CropCount(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(CropCount::getCount).reversed())
                .toList();
    }

    @Cacheable(value = "severitySummary", key = "#farmerId")
    public SeveritySummary getSeveritySummary(String farmerId) {
        log.debug("Cache MISS: severitySummary for {}", farmerId);
        List<DetectionReport> reports = reportRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
        long mild = reports.stream().filter(r -> "mild".equalsIgnoreCase(r.getSeverity())).count();
        long moderate = reports.stream().filter(r -> "moderate".equalsIgnoreCase(r.getSeverity())).count();
        long severe = reports.stream().filter(r -> "severe".equalsIgnoreCase(r.getSeverity())).count();
        return new SeveritySummary(mild, moderate, severe);
    }

    @CacheEvict(value = {"diseaseBreakdown", "monthlyTrends", "cropDistribution", "severitySummary"}, allEntries = true)
    public void evictAnalyticsCache() {
        log.info("Analytics cache evicted (new scan detected)");
    }
}
