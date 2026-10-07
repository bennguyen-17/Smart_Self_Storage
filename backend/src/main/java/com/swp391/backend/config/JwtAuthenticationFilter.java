package com.swp391.backend.config;

import com.swp391.backend.service.JwtService;
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

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
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

            try {
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Integer accountId = claims.get("userId", Integer.class);
                String role = claims.get("role", String.class);

                if (accountId != null) {
                    boolean isStaff = "4".equals(role) || "STAFF".equalsIgnoreCase(role);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    accountId,
                                    null,
                                    isStaff
                                            ? List.of(new SimpleGrantedAuthority("ROLE_STAFF"))
                                            : List.of(new SimpleGrantedAuthority("ROLE_AUTHENTICATED")));
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
