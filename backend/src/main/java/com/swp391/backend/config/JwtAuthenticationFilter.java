package com.swp391.backend.config;

import com.swp391.backend.service.JwtService;
import com.swp391.backend.service.TokenBlacklistService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public JwtAuthenticationFilter(JwtService jwtService, TokenBlacklistService tokenBlacklistService) {
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null
                && authorizationHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = authorizationHeader.substring(7);

            if (tokenBlacklistService != null && tokenBlacklistService.isBlacklisted(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            try {
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Integer accountId = claims.get("userId", Integer.class);
                String role = claims.get("role", String.class);

                if (accountId != null) {
                    boolean isAdmin = "1".equals(role) || "ADMIN".equalsIgnoreCase(role);
                    boolean isBom = "2".equals(role) || "BOM".equalsIgnoreCase(role);
                    boolean isManager = "3".equals(role) || "MANAGER".equalsIgnoreCase(role);
                    boolean isStaff = "4".equals(role) || "STAFF".equalsIgnoreCase(role);

                    String authority;

                    if (isAdmin) {
                        authority = "ROLE_ADMIN";
                    } else if (isBom) {
                        authority = "ROLE_BOM";
                    } else if (isManager) {
                        authority = "ROLE_MANAGER";
                    } else if (isStaff) {
                        authority = "ROLE_STAFF";
                    } else {
                        authority = "ROLE_AUTHENTICATED";
                    }

                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            accountId,
                            null,
                            List.of(new SimpleGrantedAuthority(authority)));

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception ignored) {
                // Invalid or expired JWTs do not create an authenticated principal.
            }
        }

        filterChain.doFilter(request, response);
    }
}
