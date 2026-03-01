package com.farmsense.service;

import com.farmsense.model.dto.AuthResponse;
import com.farmsense.model.entity.User;
import com.farmsense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final ActivityService activityService;

        public AuthResponse register(String fullName, String email, String password) {
                if (userRepository.findByEmail(email).isPresent()) {
                        return AuthResponse.builder()
                                        .message("Email already registered. Please login instead.")
                                        .build();
                }
                if (password == null || password.length() < 8) {
                        return AuthResponse.builder()
                                        .message("Password must be at least 8 characters.")
                                        .build();
                }

                User user = User.builder()
                                .fullName(fullName)
                                .email(email)
                                .passwordHash(passwordEncoder.encode(password))
                                .emailVerified(true)
                                .role("FARMER")
                                .build();

                userRepository.save(user);
                log.info("New user registered: {}", email);

                String token = jwtService.generateToken(user);

                activityService.logActivity(
                                user.getId(), user.getEmail(), user.getFullName(),
                                "REGISTER", "New account created", null);

                return AuthResponse.builder()
                                .token(token)
                                .userId(user.getId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .role(user.getRole())
                                .emailVerified(true)
                                .message("Registration successful! Welcome to FarmSense AI 🌾")
                                .build();
        }

        public AuthResponse login(String email, String password) {
                Optional<User> optUser = userRepository.findByEmail(email);
                if (optUser.isEmpty()) {
                        return AuthResponse.builder()
                                        .message("Email not found. Please register first.")
                                        .build();
                }

                User user = optUser.get();
                if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                        return AuthResponse.builder()
                                        .message("Wrong password. Please try again.")
                                        .build();
                }

                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);

                String token = jwtService.generateToken(user);

                activityService.logActivity(
                                user.getId(), user.getEmail(), user.getFullName(),
                                "LOGIN", "User logged in", null);

                log.info("User logged in: {}", email);

                return AuthResponse.builder()
                                .token(token)
                                .userId(user.getId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .role(user.getRole())
                                .emailVerified(user.isEmailVerified())
                                .message("Login successful!")
                                .build();
        }

        public AuthResponse getCurrentUser(String token) {
                if (!jwtService.validateToken(token)) {
                        return AuthResponse.builder().message("Invalid or expired token.").build();
                }
                String email = jwtService.extractEmail(token);
                return userRepository.findByEmail(email)
                                .map(user -> AuthResponse.builder()
                                                .token(token)
                                                .userId(user.getId())
                                                .email(user.getEmail())
                                                .fullName(user.getFullName())
                                                .role(user.getRole())
                                                .emailVerified(user.isEmailVerified())
                                                .build())
                                .orElse(AuthResponse.builder().message("User not found.").build());
        }
}
