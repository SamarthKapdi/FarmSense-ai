package com.farmsense.controller;

import com.farmsense.model.dto.*;
import com.farmsense.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/disease-breakdown")
    public ResponseEntity<ApiResponse<List<DiseaseCount>>> diseaseBreakdown(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getDiseaseBreakdown(userId)));
    }

    @GetMapping("/monthly-trends")
    public ResponseEntity<ApiResponse<List<MonthlyCount>>> monthlyTrends(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getMonthlyTrends(userId)));
    }

    @GetMapping("/crop-distribution")
    public ResponseEntity<ApiResponse<List<CropCount>>> cropDistribution(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getCropDistribution(userId)));
    }

    @GetMapping("/severity-summary")
    public ResponseEntity<ApiResponse<SeveritySummary>> severitySummary(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getSeveritySummary(userId)));
    }
}
