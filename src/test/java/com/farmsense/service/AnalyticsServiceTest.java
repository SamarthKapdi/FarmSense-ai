package com.farmsense.service;

import com.farmsense.model.dto.*;
import com.farmsense.model.entity.DetectionReport;
import com.farmsense.repository.ReportRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock private ReportRepository reportRepository;
    @InjectMocks private AnalyticsService analyticsService;

    private List<DetectionReport> sampleReports() {
        return List.of(
                DetectionReport.builder().diseaseName("Blight").cropName("Tomato").severity("moderate")
                        .createdAt(LocalDateTime.of(2026, 1, 15, 10, 0)).farmerId("f1").build(),
                DetectionReport.builder().diseaseName("Blight").cropName("Tomato").severity("severe")
                        .createdAt(LocalDateTime.of(2026, 1, 20, 10, 0)).farmerId("f1").build(),
                DetectionReport.builder().diseaseName("Wilt").cropName("Rice").severity("mild")
                        .createdAt(LocalDateTime.of(2026, 2, 10, 10, 0)).farmerId("f1").build(),
                DetectionReport.builder().diseaseName("Rust").cropName("Wheat").severity("moderate")
                        .createdAt(LocalDateTime.of(2026, 3, 5, 10, 0)).farmerId("f1").build()
        );
    }

    @Test
    @DisplayName("Disease breakdown — groups and counts correctly")
    void diseaseBreakdown() {
        when(reportRepository.findByFarmerIdOrderByCreatedAtDesc("f1")).thenReturn(sampleReports());
        List<DiseaseCount> result = analyticsService.getDiseaseBreakdown("f1");
        assertEquals(3, result.size());
        assertEquals("Blight", result.get(0).getDiseaseName());
        assertEquals(2L, result.get(0).getCount());
    }

    @Test
    @DisplayName("Disease breakdown — empty reports return empty list")
    void diseaseBreakdownEmpty() {
        when(reportRepository.findByFarmerIdOrderByCreatedAtDesc("f2")).thenReturn(List.of());
        assertTrue(analyticsService.getDiseaseBreakdown("f2").isEmpty());
    }

    @Test
    @DisplayName("Monthly trends — groups by month correctly")
    void monthlyTrends() {
        when(reportRepository.findByFarmerIdOrderByCreatedAtDesc("f1")).thenReturn(sampleReports());
        List<MonthlyCount> result = analyticsService.getMonthlyTrends("f1");
        assertEquals(3, result.size()); // Jan, Feb, Mar
        assertEquals(1, result.get(0).getMonth()); // January
        assertEquals(2L, result.get(0).getCount()); // 2 reports in Jan
    }

    @Test
    @DisplayName("Crop distribution — groups correctly")
    void cropDistribution() {
        when(reportRepository.findByFarmerIdOrderByCreatedAtDesc("f1")).thenReturn(sampleReports());
        List<CropCount> result = analyticsService.getCropDistribution("f1");
        assertEquals(3, result.size());
        assertEquals("Tomato", result.get(0).getCropName());
        assertEquals(2L, result.get(0).getCount());
    }

    @Test
    @DisplayName("Severity summary — counts each level")
    void severitySummary() {
        when(reportRepository.findByFarmerIdOrderByCreatedAtDesc("f1")).thenReturn(sampleReports());
        SeveritySummary summary = analyticsService.getSeveritySummary("f1");
        assertEquals(1L, summary.getMild());
        assertEquals(2L, summary.getModerate());
        assertEquals(1L, summary.getSevere());
    }

    @Test
    @DisplayName("Severity summary — all zeros for empty reports")
    void severitySummaryEmpty() {
        when(reportRepository.findByFarmerIdOrderByCreatedAtDesc("f2")).thenReturn(List.of());
        SeveritySummary summary = analyticsService.getSeveritySummary("f2");
        assertEquals(0L, summary.getMild());
        assertEquals(0L, summary.getModerate());
        assertEquals(0L, summary.getSevere());
    }

    @Test
    @DisplayName("Disease breakdown — null disease names are filtered")
    void diseaseBreakdownNulls() {
        List<DetectionReport> withNulls = List.of(
                DetectionReport.builder().diseaseName(null).farmerId("f1").build(),
                DetectionReport.builder().diseaseName("Blight").farmerId("f1").build()
        );
        when(reportRepository.findByFarmerIdOrderByCreatedAtDesc("f1")).thenReturn(withNulls);
        List<DiseaseCount> result = analyticsService.getDiseaseBreakdown("f1");
        assertEquals(1, result.size());
    }
}
