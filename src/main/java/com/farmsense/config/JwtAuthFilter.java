package com.farmsense.config;

import com.farmsense.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (request.getParameter("token") != null) {
            token = request.getParameter("token");
        }

        if (token != null) {

            if (jwtService.validateToken(token)) {
                String email = jwtService.extractEmail(token);
                String userId = jwtService.extractUserId(token);
                String fullName = jwtService.extractFullName(token);

                request.setAttribute("userId", userId);
                request.setAttribute("userEmail", email);
                request.setAttribute("userName", fullName);

                String role = jwtService.extractRole(token);
                if (role == null || role.isEmpty()) {
                    role = "ROLE_FARMER"; // fallback
                }

                var authority = new SimpleGrantedAuthority(role);
                var authorities = List.of(authority);
                
                log.info("JWT Token Parsed -> Email: {}, Role Extracted: {}, Authorities Assigned: {}", email, role, authorities);

                var auth = new UsernamePasswordAuthenticationToken(
                        email, null,
                        authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
