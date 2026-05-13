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
 * Simple in-memory rate limiter for auth and AI endpoints.
 * Max 5 login requests per 60s, Max 10 AI requests per 60s.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Slf4j
public class RateLimitFilter implements Filter {

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int MAX_AI_ATTEMPTS = 15;
    private static final long WINDOW_MS = 60_000L;

    private final ConcurrentHashMap<String, List<Long>> ipAttempts = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        String uri = request.getRequestURI();

        // Rate-limit login and AI endpoints
        boolean isLogin = "/api/auth/login".equals(uri) && "POST".equalsIgnoreCase(request.getMethod());
        boolean isAI = uri.startsWith("/api/farm/") && "POST".equalsIgnoreCase(request.getMethod());

        if (isLogin || isAI) {
            String ip = getClientIp(request);
            long now = System.currentTimeMillis();

            String key = ip + (isLogin ? "_login" : "_ai");
            List<Long> timestamps = ipAttempts.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>());

            // Remove expired entries
            timestamps.removeIf(t -> (now - t) > WINDOW_MS);

            int maxAttempts = isLogin ? MAX_LOGIN_ATTEMPTS : MAX_AI_ATTEMPTS;

            if (timestamps.size() >= maxAttempts) {
                log.warn("Rate limit exceeded for IP: {} on URI: {}", ip, uri);
                HttpServletResponse response = (HttpServletResponse) res;
                response.setStatus(429);
                response.setContentType("application/json");
                String msg = isLogin ? "Too many login attempts." : "Too many AI requests.";
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"" + msg + " Please try again in 1 minute.\"}");
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
