package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.entity.Advisory;
import com.farmsense.model.entity.DetectionReport;
import com.farmsense.model.entity.UserActivity;
import com.farmsense.service.AgronomistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agronomist")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('AGRONOMIST', 'ADMIN')")
public class AgronomistController {

    private final AgronomistService agronomistService;

    @GetMapping("/disease-trends")
    public ResponseEntity<ApiResponse<List<Object[]>>> getDiseaseTrends() {
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.getDiseaseTrends(30)));
    }

    @GetMapping("/pending-verifications")
    public ResponseEntity<ApiResponse<List<DetectionReport>>> getPendingVerifications() {
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.getPendingVerifications()));
    }

    @PatchMapping("/verify/{reportId}")
    public ResponseEntity<ApiResponse<DetectionReport>> verifyDiagnosis(
            @PathVariable String reportId, @RequestBody Map<String, String> payload, Principal principal) {
        String correctDisease = payload.get("correctDisease");
        String notes = payload.get("notes");
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.verifyDiagnosis(reportId, correctDisease, notes, email)));
    }

    @PostMapping("/advisory")
    public ResponseEntity<ApiResponse<Advisory>> publishAdvisory(
            @RequestBody Advisory advisory, Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.publishAdvisory(advisory, email)));
    }

    @GetMapping("/advisories")
    public ResponseEntity<ApiResponse<List<Advisory>>> getAdvisories() {
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.getAllAdvisories()));
    }

    @GetMapping("/farmer-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFarmerStats() {
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.getFarmerStats()));
    }

    @GetMapping("/activity-feed")
    public ResponseEntity<ApiResponse<List<UserActivity>>> getActivityFeed(
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.getUnifiedActivities(type, limit)));
    }
}
