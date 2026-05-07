package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.entity.Advisory;
import com.farmsense.model.entity.DetectionReport;
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
            @PathVariable String reportId, @RequestBody Map<String, String> payload) {
        String correctDisease = payload.get("correctDisease");
        String notes = payload.get("notes");
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.verifyDiagnosis(reportId, correctDisease, notes)));
    }

    @PostMapping("/advisory")
    public ResponseEntity<ApiResponse<Advisory>> publishAdvisory(
            @RequestBody Advisory advisory, Principal principal) {
        // Find user by email or id from principal to set authorId.
        // Assuming principal.getName() returns the email or ID depending on JwtService config.
        // Usually, principal.getName() is the subject (email) or UUID.
        // Let's assume it's UUID. If not, the agronomistService can fetch User from DB.
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.publishAdvisory(advisory, principal.getName())));
    }

    @GetMapping("/advisories")
    public ResponseEntity<ApiResponse<List<Advisory>>> getAdvisories() {
        return ResponseEntity.ok(ApiResponse.ok(agronomistService.getAllAdvisories()));
    }
}
