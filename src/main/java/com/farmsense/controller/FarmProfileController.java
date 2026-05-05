package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.dto.FarmProfileRequest;
import com.farmsense.model.dto.FarmProfileResponse;
import com.farmsense.service.FarmProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farm-profile")
@RequiredArgsConstructor
public class FarmProfileController {

    private final FarmProfileService farmProfileService;

    @PostMapping
    public ResponseEntity<ApiResponse<FarmProfileResponse>> create(
            @Valid @RequestBody FarmProfileRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        FarmProfileResponse profile = farmProfileService.createProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Farm profile created", profile));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FarmProfileResponse>>> getAll(HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(farmProfileService.getUserProfiles(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FarmProfileResponse>> getOne(
            @PathVariable String id, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok(farmProfileService.getProfile(id, userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FarmProfileResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody FarmProfileRequest request,
            HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", farmProfileService.updateProfile(id, userId, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String id, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        farmProfileService.deleteProfile(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Farm profile deleted", null));
    }
}
