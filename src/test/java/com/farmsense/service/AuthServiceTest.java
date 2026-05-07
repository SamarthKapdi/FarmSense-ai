package com.farmsense.service;

import com.farmsense.model.dto.AuthRequest;
import com.farmsense.model.dto.AuthResponse;
import com.farmsense.model.entity.User;
import com.farmsense.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private ActivityService activityService;
    @InjectMocks private AuthService authService;

    @Test
    @DisplayName("Register — success with valid data")
    void registerSuccess() {
        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId("uuid-1");
            return u;
        });
        when(jwtService.generateToken(any())).thenReturn("jwt-token-123");

        AuthRequest request = new AuthRequest();
        request.setEmail("new@test.com");
        request.setPassword("password123");
        request.setFullName("Test User");
        request.setRole("FARMER");
        
        AuthResponse resp = authService.register(request);

        assertNotNull(resp.getToken());
        assertEquals("jwt-token-123", resp.getToken());
        assertEquals("new@test.com", resp.getEmail());
        verify(userRepository).save(any(User.class));
        verify(activityService).logActivity(any(), eq("new@test.com"), eq("Test User"), eq("REGISTER"), any(), any());
    }

    @Test
    @DisplayName("Register — fails with duplicate email")
    void registerDuplicateEmail() {
        when(userRepository.findByEmail("exists@test.com")).thenReturn(Optional.of(new User()));

        AuthRequest request = new AuthRequest();
        request.setEmail("exists@test.com");
        request.setPassword("password123");
        request.setFullName("Dup User");
        request.setRole("FARMER");
        
        AuthResponse resp = authService.register(request);

        assertNull(resp.getToken());
        assertTrue(resp.getMessage().contains("already registered"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Register — fails with short password")
    void registerShortPassword() {
        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());

        AuthRequest request = new AuthRequest();
        request.setEmail("new@test.com");
        request.setPassword("short");
        request.setFullName("Test");
        
        AuthResponse resp = authService.register(request);

        assertNull(resp.getToken());
        assertTrue(resp.getMessage().contains("8 characters"));
    }
    
    @Test
    @DisplayName("Register — agronomist with wrong code")
    void registerAgronomistWrongCode() {
        when(userRepository.findByEmail("agro@test.com")).thenReturn(Optional.empty());

        AuthRequest request = new AuthRequest();
        request.setEmail("agro@test.com");
        request.setPassword("password123");
        request.setFullName("Test Agro");
        request.setRole("AGRONOMIST");
        request.setAgronomistCode("WRONGCODE");
        
        AuthResponse resp = authService.register(request);

        assertNull(resp.getToken());
        assertTrue(resp.getMessage().contains("Invalid Agronomist Code"));
    }

    @Test
    @DisplayName("Register — agronomist with correct code")
    void registerAgronomistCorrectCode() {
        when(userRepository.findByEmail("agro@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId("uuid-2");
            return u;
        });
        when(jwtService.generateToken(any())).thenReturn("jwt-token-agro");

        AuthRequest request = new AuthRequest();
        request.setEmail("agro@test.com");
        request.setPassword("password123");
        request.setFullName("Test Agro");
        request.setRole("AGRONOMIST");
        request.setAgronomistCode("AGRI2026");
        
        AuthResponse resp = authService.register(request);

        assertNotNull(resp.getToken());
        assertEquals("jwt-token-agro", resp.getToken());
        assertEquals("ROLE_AGRONOMIST", resp.getRole());
    }

    @Test
    @DisplayName("Register — attempt as admin is rejected")
    void registerAdminRejected() {
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.empty());

        AuthRequest request = new AuthRequest();
        request.setEmail("admin@test.com");
        request.setPassword("password123");
        request.setFullName("Test Admin");
        request.setRole("ADMIN");
        
        AuthResponse resp = authService.register(request);

        assertNull(resp.getToken());
        assertTrue(resp.getMessage().contains("Cannot register as ADMIN"));
    }

    @Test
    @DisplayName("Login — success with valid credentials")
    void loginSuccess() {
        User user = User.builder().id("uuid-1").email("user@test.com")
                .passwordHash("$2a$hashed").fullName("Test").role("FARMER").emailVerified(true).build();
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "$2a$hashed")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        when(userRepository.save(any())).thenReturn(user);

        AuthResponse resp = authService.login("user@test.com", "password123");

        assertNotNull(resp.getToken());
        assertEquals("uuid-1", resp.getUserId());
    }

    @Test
    @DisplayName("Login — fails with wrong password")
    void loginWrongPassword() {
        User user = User.builder().passwordHash("$2a$hashed").build();
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "$2a$hashed")).thenReturn(false);

        AuthResponse resp = authService.login("user@test.com", "wrong");

        assertNull(resp.getToken());
        assertTrue(resp.getMessage().contains("Wrong password"));
    }

    @Test
    @DisplayName("Login — fails with unknown email")
    void loginUnknownEmail() {
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        AuthResponse resp = authService.login("nobody@test.com", "password");

        assertNull(resp.getToken());
        assertTrue(resp.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("Register — null password returns error")
    void registerNullPassword() {
        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());

        AuthRequest request = new AuthRequest();
        request.setEmail("new@test.com");
        request.setFullName("Test");
        
        AuthResponse resp = authService.register(request);

        assertNull(resp.getToken());
        assertTrue(resp.getMessage().contains("8 characters"));
    }
}
