package com.farmsense.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Logs every HTTP request with method, URI, IP, status, and duration.
 * Adds a unique requestId to MDC for log correlation.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class LoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String uri = request.getRequestURI();

        // Skip noisy health checks
        if (uri.contains("/health") || uri.contains("/actuator")) {
            chain.doFilter(req, res);
            return;
        }

        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("requestId", requestId);

        long start = System.currentTimeMillis();

        try {
            chain.doFilter(req, res);
        } finally {
            long duration = System.currentTimeMillis() - start;
            log.info("[{}] {} {} → {} ({}ms) [IP: {}]",
                    requestId,
                    request.getMethod(),
                    uri,
                    response.getStatus(),
                    duration,
                    request.getRemoteAddr());
            MDC.remove("requestId");
        }
    }
}
