package com.swp391.backend.config;

import com.swp391.backend.service.JwtService;
import com.swp391.backend.service.TokenBlacklistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public SecurityConfig(JwtService jwtService, TokenBlacklistService tokenBlacklistService) {
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .authorizeHttpRequests(auth -> auth
                        // API công khai
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/facilities", "/api/facilities/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/images/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/units", "/api/units/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/prices", "/api/prices/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/fee-policies", "/api/fee-policies/**").permitAll()
                        .requestMatchers("/api/pricing/calculate").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/contracts/*/pdf").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // BOM và Admin
                        .requestMatchers("/api/bom/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers("/api/admin/accounts/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/facilities/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/facilities/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/facilities/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/prices/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/prices/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/prices/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/fee-policies/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/fee-policies/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/fee-policies/**").hasAnyRole("BOM", "ADMIN")

                        // Admin
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Manager
                        .requestMatchers("/api/manager/**").hasAnyRole("MANAGER", "ADMIN")

                        // Staff
                        .requestMatchers("/api/staff/**").hasAnyRole("STAFF", "MANAGER", "ADMIN")

                        // Người dùng đã đăng nhập
                        .requestMatchers("/api/customer/**").authenticated()
                        .requestMatchers("/api/contracts/**").authenticated()
                        .requestMatchers("/api/deposits/**").authenticated()
                        .requestMatchers("/api/payment/**").authenticated()

                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            log.warn("Truy cập bị từ chối 403 (Sai vai trò): URI={}, IP={}",
                                    request.getRequestURI(), request.getRemoteAddr());
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"message\":\"Bạn không có quyền truy cập chức năng này (403 Forbidden)!\"}");
                        }))
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtService, tokenBlacklistService),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
