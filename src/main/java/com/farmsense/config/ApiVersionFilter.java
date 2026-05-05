package com.farmsense.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * API Versioning Filter — maps /api/v1/* requests to /api/* endpoints.
 * Both /api/* (legacy) and /api/v1/* (versioned) work identically.
 * This enables future versioning without breaking existing clients.
 */
@Component
@Order(1)
public class ApiVersionFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) request;
        String uri = httpReq.getRequestURI();

        if (uri.startsWith("/api/v1/")) {
            String rewritten = "/api/" + uri.substring(8); // Remove "v1/"
            chain.doFilter(new RewrittenRequest(httpReq, rewritten), response);
        } else {
            chain.doFilter(request, response);
        }
    }

    private static class RewrittenRequest extends HttpServletRequestWrapper {
        private final String newUri;

        public RewrittenRequest(HttpServletRequest request, String newUri) {
            super(request);
            this.newUri = newUri;
        }

        @Override
        public String getRequestURI() {
            return newUri;
        }

        @Override
        public String getServletPath() {
            return newUri;
        }
    }
}
