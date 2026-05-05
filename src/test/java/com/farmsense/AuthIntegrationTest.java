package com.farmsense;

import com.farmsense.model.dto.AuthRequest;
import com.farmsense.model.dto.AuthResponse;
import com.farmsense.model.dto.ApiResponse;
import com.farmsense.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test") // ensure test db or configuration is used
class AuthIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll(); // clean db before each test
    }

    @Test
    void testRegisterLoginAndGetProfile_Integration() {
        // 1. Register User
        AuthRequest req = new AuthRequest();
        req.setFullName("John Doe");
        req.setEmail("john.doe@example.com");
        req.setPassword("Secure@123");

        ResponseEntity<ApiResponse<AuthResponse>> regRes = restTemplate.exchange(
                "/api/auth/register",
                HttpMethod.POST,
                new org.springframework.http.HttpEntity<>(req),
                new ParameterizedTypeReference<>() {}
        );

        assertEquals(HttpStatus.OK, regRes.getStatusCode());
        assertNotNull(regRes.getBody());
        assertTrue(regRes.getBody().isSuccess());
        assertNotNull(regRes.getBody().getData().getToken());
        assertNotNull(regRes.getBody().getData().getRefreshToken());

        // 2. Login User
        AuthRequest loginReq = new AuthRequest();
        loginReq.setEmail("john.doe@example.com");
        loginReq.setPassword("Secure@123");

        ResponseEntity<ApiResponse<AuthResponse>> loginRes = restTemplate.exchange(
                "/api/auth/login",
                HttpMethod.POST,
                new org.springframework.http.HttpEntity<>(loginReq),
                new ParameterizedTypeReference<>() {}
        );

        assertEquals(HttpStatus.OK, loginRes.getStatusCode());
        String token = loginRes.getBody().getData().getToken();

        // 3. Get Me
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        org.springframework.http.HttpEntity<?> getReq = new org.springframework.http.HttpEntity<>(headers);

        ResponseEntity<ApiResponse<AuthResponse>> meRes = restTemplate.exchange(
                "/api/auth/me",
                HttpMethod.GET,
                getReq,
                new ParameterizedTypeReference<>() {}
        );

        assertEquals(HttpStatus.OK, meRes.getStatusCode());
        assertEquals("john.doe@example.com", meRes.getBody().getData().getEmail());
    }
}
