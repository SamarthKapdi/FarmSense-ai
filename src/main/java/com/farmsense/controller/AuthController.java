package com.farmsense.controller;

import com.farmsense.model.dto.AuthRequest;
import com.farmsense.model.dto.AuthResponse;
import com.farmsense.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.register(
                    request.getFullName(), request.getEmail(), request.getPassword());
            if (response.getToken() != null) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("Register error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request.getEmail(), request.getPassword());
            if (response.getToken() != null) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("Login error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            AuthResponse response = authService.getCurrentUser(token);
            if (response.getUserId() != null) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(401).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }
    }
}
