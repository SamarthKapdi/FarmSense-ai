package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.entity.User;
import com.farmsense.model.entity.UserActivity;
import com.farmsense.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers()));
    }

    @PatchMapping("/users/{userId}/disable")
    public ResponseEntity<ApiResponse<User>> disableUser(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.toggleUserEnabled(userId, false)));
    }

    @PatchMapping("/users/{userId}/enable")
    public ResponseEntity<ApiResponse<User>> enableUser(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.toggleUserEnabled(userId, true)));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable String userId) {
        adminService.softDeleteUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("User deleted (soft)"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getSystemStats()));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealthStatus() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getHealthStatus()));
    }

    @GetMapping("/activities")
    public ResponseEntity<ApiResponse<List<UserActivity>>> getRecentActivities(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getRecentActivities(limit)));
    }

    @GetMapping("/agronomists")
    public ResponseEntity<ApiResponse<List<User>>> getAgronomists() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAgronomists()));
    }

    @PatchMapping("/config")
    public ResponseEntity<ApiResponse<Object>> updateConfig(
            @RequestBody Map<String, String> payload, Principal principal) {
        String key = payload.get("configKey");
        String value = payload.get("configValue");
        return ResponseEntity.ok(ApiResponse.ok(adminService.updateConfig(key, value, principal.getName())));
    }
}
