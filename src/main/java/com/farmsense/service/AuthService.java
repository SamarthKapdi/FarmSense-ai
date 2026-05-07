package com.farmsense.service;

import com.farmsense.model.dto.AuthResponse;
import com.farmsense.model.entity.PasswordResetToken;
import com.farmsense.model.entity.User;
import com.farmsense.repository.PasswordResetTokenRepository;
import com.farmsense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final ActivityService activityService;
        private final PasswordResetTokenRepository resetTokenRepository;
        private final TotpService totpService;

        public AuthResponse register(com.farmsense.model.dto.AuthRequest request) {
                String email = request.getEmail();
                String password = request.getPassword();
                String fullName = request.getFullName();
                
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

                String role = "ROLE_FARMER";
                if (request.getRole() != null && !request.getRole().isEmpty()) {
                        String requestedRole = request.getRole().toUpperCase();
                        if (!requestedRole.startsWith("ROLE_")) {
                                requestedRole = "ROLE_" + requestedRole;
                        }
                        if ("ROLE_ADMIN".equals(requestedRole)) {
                                return AuthResponse.builder()
                                                .message("Cannot register as ADMIN.")
                                                .build();
                        }
                        if ("ROLE_AGRONOMIST".equals(requestedRole)) {
                                if (!"AGRI2026".equals(request.getAgronomistCode())) {
                                        return AuthResponse.builder()
                                                        .message("Invalid Agronomist Code.")
                                                        .build();
                                }
                                role = requestedRole;
                        }
                }

                User user = User.builder()
                                .fullName(fullName)
                                .email(email)
                                .passwordHash(passwordEncoder.encode(password))
                                .emailVerified(true)
                                .role(role)
                                .build();

                userRepository.save(user);
                log.info("New user registered: {}", email);

                String token = jwtService.generateToken(user);
                String refreshToken = jwtService.generateRefreshToken(user);

                activityService.logActivity(
                                user.getId(), user.getEmail(), user.getFullName(),
                                "REGISTER", "New account created", null);

                return AuthResponse.builder()
                                .token(token)
                                .refreshToken(refreshToken)
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

                if (user.getTotpSecret() != null && !user.getTotpSecret().isEmpty()) {
                        return AuthResponse.builder()
                                        .requiresTwoFactor(true)
                                        .email(user.getEmail())
                                        .message("2FA required")
                                        .build();
                }

                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);

                String token = jwtService.generateToken(user);
                String refreshToken = jwtService.generateRefreshToken(user);

                activityService.logActivity(
                                user.getId(), user.getEmail(), user.getFullName(),
                                "LOGIN", "User logged in", null);

                log.info("User logged in: {}", email);

                return AuthResponse.builder()
                                .token(token)
                                .refreshToken(refreshToken)
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

        public AuthResponse refreshAccessToken(String refreshToken) {
                if (!jwtService.validateToken(refreshToken)) {
                        return AuthResponse.builder().message("Invalid or expired refresh token.").build();
                }
                String email = jwtService.extractEmail(refreshToken);
                return userRepository.findByEmail(email)
                                .map(user -> {
                                        String newToken = jwtService.generateToken(user);
                                        return AuthResponse.builder()
                                                        .token(newToken)
                                                        .refreshToken(refreshToken)
                                                        .userId(user.getId())
                                                        .email(user.getEmail())
                                                        .fullName(user.getFullName())
                                                        .role(user.getRole())
                                                        .message("Token refreshed successfully")
                                                        .build();
                                })
                                .orElse(AuthResponse.builder().message("User not found.").build());
        }

        public String requestPasswordReset(String email) {
                Optional<User> optUser = userRepository.findByEmail(email);
                if (optUser.isEmpty()) {
                        return "If the email exists, a reset code has been sent."; // Don't reveal if email exists
                }

                String code = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 999999));

                PasswordResetToken resetToken = PasswordResetToken.builder()
                                .email(email)
                                .token(code)
                                .expiryDate(LocalDateTime.now().plusMinutes(15))
                                .build();
                resetTokenRepository.save(resetToken);

                log.info("🔑 PASSWORD RESET CODE for {}: {} (valid 15 min)", email, code);
                return "If the email exists, a reset code has been sent.";
        }

        public String resetPassword(String email, String code, String newPassword) {
                if (newPassword == null || newPassword.length() < 8) {
                        return "Password must be at least 8 characters.";
                }

                Optional<PasswordResetToken> opt = resetTokenRepository
                                .findByEmailAndTokenAndUsedFalse(email, code);

                if (opt.isEmpty()) {
                        return "Invalid or expired reset code.";
                }

                PasswordResetToken resetToken = opt.get();
                if (resetToken.isExpired()) {
                        return "Reset code has expired. Please request a new one.";
                }

                Optional<User> userOpt = userRepository.findByEmail(email);
                if (userOpt.isEmpty()) {
                        return "User not found.";
                }

                User user = userOpt.get();
                user.setPasswordHash(passwordEncoder.encode(newPassword));
                userRepository.save(user);

                resetToken.setUsed(true);
                resetTokenRepository.save(resetToken);

                log.info("Password reset successful for: {}", email);
                return "OK";
        }

        public String enable2FA(String userId) {
                User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
                if (!"ROLE_ADMIN".equals(user.getRole())) {
                        throw new RuntimeException("Only admins can enable 2FA");
                }
                String secret = totpService.generateSecretKey();
                user.setTotpSecret(secret);
                userRepository.save(user);
                return totpService.getQrCodeImageUri(user.getEmail(), secret);
        }

        public AuthResponse verify2FA(String email, String code) {
                Optional<User> optUser = userRepository.findByEmail(email);
                if (optUser.isEmpty()) {
                        return AuthResponse.builder().message("User not found").build();
                }

                User user = optUser.get();
                if (user.getTotpSecret() == null) {
                        return AuthResponse.builder().message("2FA not enabled for user").build();
                }

                if (!totpService.verifyCode(user.getTotpSecret(), code)) {
                        return AuthResponse.builder().message("Invalid 2FA code").build();
                }

                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);

                String token = jwtService.generateToken(user);
                String refreshToken = jwtService.generateRefreshToken(user);

                activityService.logActivity(
                                user.getId(), user.getEmail(), user.getFullName(),
                                "LOGIN", "User logged in with 2FA", null);

                log.info("User logged in with 2FA: {}", email);

                return AuthResponse.builder()
                                .token(token)
                                .refreshToken(refreshToken)
                                .userId(user.getId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .role(user.getRole())
                                .emailVerified(user.isEmailVerified())
                                .build();
        }
}
