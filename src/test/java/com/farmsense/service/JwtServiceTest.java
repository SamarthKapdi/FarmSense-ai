package com.farmsense.service;

import com.farmsense.model.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() throws Exception {
        jwtService = new JwtService();
        // Inject test values via reflection
        var secretField = JwtService.class.getDeclaredField("jwtSecret");
        secretField.setAccessible(true);
        secretField.set(jwtService, "TestSecretKeyForJWTServiceUnitTestingMustBe64CharsLongOrMore!!");

        var expField = JwtService.class.getDeclaredField("jwtExpiration");
        expField.setAccessible(true);
        expField.set(jwtService, 3600000L); // 1 hour
    }

    @Test
    @DisplayName("Generate token — returns non-null")
    void generateTokenNotNull() {
        User user = User.builder().id("u1").email("test@test.com").fullName("Test").role("FARMER").build();
        String token = jwtService.generateToken(user);
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    @DisplayName("Validate token — valid token returns true")
    void validateTokenValid() {
        User user = User.builder().id("u1").email("test@test.com").fullName("Test").role("FARMER").build();
        String token = jwtService.generateToken(user);
        assertTrue(jwtService.validateToken(token));
    }

    @Test
    @DisplayName("Validate token — garbage returns false")
    void validateTokenGarbage() {
        assertFalse(jwtService.validateToken("not.a.real.token"));
    }

    @Test
    @DisplayName("Extract email — matches generated user")
    void extractEmail() {
        User user = User.builder().id("u1").email("farmer@test.com").fullName("F").role("FARMER").build();
        String token = jwtService.generateToken(user);
        assertEquals("farmer@test.com", jwtService.extractEmail(token));
    }

    @Test
    @DisplayName("Extract userId — matches generated user")
    void extractUserId() {
        User user = User.builder().id("user-uuid").email("a@b.com").fullName("A").role("FARMER").build();
        String token = jwtService.generateToken(user);
        assertEquals("user-uuid", jwtService.extractUserId(token));
    }

    @Test
    @DisplayName("Extract fullName — matches generated user")
    void extractFullName() {
        User user = User.builder().id("u1").email("a@b.com").fullName("Rajesh Kumar").role("FARMER").build();
        String token = jwtService.generateToken(user);
        assertEquals("Rajesh Kumar", jwtService.extractFullName(token));
    }

    @Test
    @DisplayName("Validate token — empty string returns false")
    void validateTokenEmpty() {
        assertFalse(jwtService.validateToken(""));
    }

    @Test
    @DisplayName("Validate token — null returns false")
    void validateTokenNull() {
        assertFalse(jwtService.validateToken(null));
    }
}
