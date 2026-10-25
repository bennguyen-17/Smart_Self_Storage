package com.swp391.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.swp391.backend.service.JwtService;

@Configuration
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtService jwtService;

    public SecurityConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/customer/contracts/overdue-alerts")
                        .hasRole("AUTHENTICATED")

                        .requestMatchers("/api/staff/contracts/overdue-alerts")
                        .hasRole("STAFF")

                        .requestMatchers("/api/staff/shifts/current", "/api/staff/shifts/current/start")
                        .hasRole("STAFF")

                        .requestMatchers("/api/staff/tickets/**")
                        .hasRole("STAFF")

                        .requestMatchers("/api/staff/tasks/**")
                        .hasRole("STAFF")

                        .requestMatchers("/api/staff/units/**")
                        .hasRole("STAFF")

                        .requestMatchers("/api/staff/checkout/**")
                        .hasRole("STAFF")

                        .requestMatchers("/api/manager/contracts/overdue-alerts")
                        .hasRole("MANAGER")

                        .requestMatchers("/api/contracts/*/cancel-deposit")
                        .hasRole("AUTHENTICATED")

                        .requestMatchers(
                                "/api/staff/reservations",
                                "/api/staff/reservations/lookup",
                                "/api/staff/reservations/*/check-in")
                        .hasAnyRole("STAFF", "MANAGER", "ADMIN")

                        .requestMatchers(
                                "/api/staff/audit-logs/manual-gate-open")
                        .hasRole("STAFF")

                        .requestMatchers("/api/admin/dashboard/**")
                        .hasAnyRole("ADMIN", "BOM")

                        // B3: Chặn quyền API: /api/admin/** chỉ ADMIN, /api/manager/** chỉ MANAGER
                        .requestMatchers("/api/admin/**")
                        .hasRole("ADMIN")

                        .requestMatchers("/api/manager/**")
                        .hasRole("MANAGER")

                        .anyRequest().permitAll())
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
                        new JwtAuthenticationFilter(jwtService),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}
