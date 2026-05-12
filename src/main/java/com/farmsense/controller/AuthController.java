package com.farmsense.controller;

import com.farmsense.model.dto.ApiResponse;
import com.farmsense.model.dto.AuthRequest;
import com.farmsense.model.dto.AuthResponse;
import com.farmsense.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody AuthRequest request) {
        log.warn("[AUTH] Register attempt — email={}, fullName={}", request.getEmail(), request.getFullName());
        AuthResponse response = authService.register(request);
        if (response.getToken() != null) {
            log.warn("[AUTH] Register SUCCESS — email={}", request.getEmail());
            return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
        }
        String msg = response.getMessage();
        log.warn("[AUTH] Register FAILED — email={}, reason={}", request.getEmail(), msg);
        if (msg != null && msg.contains("already registered")) {
            return ResponseEntity.status(409).body(ApiResponse.error(msg));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(msg));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        log.warn("[AUTH] Login attempt — email={}", request.getEmail());
        AuthResponse response = authService.login(request.getEmail(), request.getPassword());
        if (response.getToken() != null) {
            log.warn("[AUTH] Login SUCCESS — email={}", request.getEmail());
            return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
        }
        log.warn("[AUTH] Login FAILED — email={}, reason={}", request.getEmail(), response.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(response.getMessage()));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        AuthResponse response = authService.getCurrentUser(token);
        if (response.getUserId() != null) {
            return ResponseEntity.ok(ApiResponse.ok(response));
        }
        return ResponseEntity.status(401).body(ApiResponse.error("Invalid token"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Refresh token required"));
        }
        AuthResponse response = authService.refreshAccessToken(refreshToken);
        if (response.getToken() != null) {
            return ResponseEntity.ok(ApiResponse.ok("Token refreshed", response));
        }
        return ResponseEntity.status(401).body(ApiResponse.error(response.getMessage()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        String msg = authService.requestPasswordReset(email);
        return ResponseEntity.ok(ApiResponse.ok(msg));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        String newPassword = body.get("newPassword");
        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email, code, and newPassword are required"));
        }
        String result = authService.resetPassword(email, code, newPassword);
        if ("OK".equals(result)) {
            return ResponseEntity.ok(ApiResponse.ok("Password reset successful. Please login with your new password."));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(result));
    }

    @PostMapping("/enable-2fa")
    public ResponseEntity<ApiResponse<String>> enable2FA(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        try {
            String qrCodeUri = authService.enable2FA(userId);
            return ResponseEntity.ok(ApiResponse.ok("2FA enabled", qrCodeUri));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<ApiResponse<AuthResponse>> verify2FA(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email and code required"));
        }
        AuthResponse response = authService.verify2FA(email, code);
        if (response.getToken() != null) {
            return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(response.getMessage()));
    }
}
