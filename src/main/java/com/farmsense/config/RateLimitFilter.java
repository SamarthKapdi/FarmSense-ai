package com.farmsense.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Simple in-memory rate limiter for auth endpoints.
 * Max 5 requests per IP per 60-second window on /api/auth/login.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Slf4j
public class RateLimitFilter implements Filter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, List<Long>> ipAttempts = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        String uri = request.getRequestURI();

        // Only rate-limit login endpoint
        if ("/api/auth/login".equals(uri) && "POST".equalsIgnoreCase(request.getMethod())) {
            String ip = getClientIp(request);
            long now = System.currentTimeMillis();

            List<Long> timestamps = ipAttempts.computeIfAbsent(ip, k -> new CopyOnWriteArrayList<>());

            // Remove expired entries
            timestamps.removeIf(t -> (now - t) > WINDOW_MS);

            if (timestamps.size() >= MAX_ATTEMPTS) {
                log.warn("Rate limit exceeded for IP: {}", ip);
                HttpServletResponse response = (HttpServletResponse) res;
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Too many login attempts. Please try again in 1 minute.\"}");
                return;
            }

            timestamps.add(now);
        }

        chain.doFilter(req, res);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
