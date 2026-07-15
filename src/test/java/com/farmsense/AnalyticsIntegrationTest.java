package com.farmsense;

import com.farmsense.model.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AnalyticsIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void testAnalyticsEndpointRequiresAuth() {
        ResponseEntity<ApiResponse<Object>> res = restTemplate.exchange(
                "/api/analytics",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
        );
        // Should be 401 or 403 because no JWT token is provided
        org.junit.jupiter.api.Assertions.assertTrue(
                res.getStatusCode() == HttpStatus.FORBIDDEN || res.getStatusCode() == HttpStatus.UNAUTHORIZED,
                "Expected 401 UNAUTHORIZED or 403 FORBIDDEN for unauthenticated access, but got: " + res.getStatusCode()
        );
    }
}
