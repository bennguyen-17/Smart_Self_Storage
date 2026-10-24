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
                .authorizeHttpRequests(auth -> auth
                        // 1. Các API công khai không cần đăng nhập
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/facilities", "/api/facilities/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/units/**", "/api/units/filter").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/prices", "/api/prices/**").permitAll()
                        .requestMatchers("/api/pricing/calculate").permitAll()
                        .requestMatchers("/api/deposits/webhook").permitAll()
                        .requestMatchers("/api/payment/vnpay/callback", "/api/payment/vnpay/ipn").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // 2. Quyền Ban Giám Đốc (BOM) & Quản Trị Hệ Thống (ADMIN)
                        .requestMatchers("/api/bom/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers("/api/dashboard/chain").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers("/api/deposits/mock-pay").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/facilities/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/facilities/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/facilities/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/prices/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/prices/**").hasAnyRole("BOM", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/prices/**").hasAnyRole("BOM", "ADMIN")

                        // 3. Quyền Quản trị viên (ADMIN)
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 4. Quyền Quản lý cơ sở (MANAGER)
                        .requestMatchers("/api/manager/**").hasAnyRole("MANAGER", "ADMIN")

                        // 5. Quyền Nhân viên quầy (STAFF)
                        .requestMatchers("/api/staff/**").hasAnyRole("STAFF", "MANAGER", "ADMIN")

                        // 6. Quyền Khách hàng & Người dùng đã đăng nhập (AUTHENTICATED)
                        .requestMatchers("/api/customer/**").authenticated()
                        .requestMatchers("/api/contracts/**").authenticated()
                        .requestMatchers("/api/deposits/**").authenticated()
                        .requestMatchers("/api/payment/**").authenticated()
                        .requestMatchers("/api/gate-pin/**").authenticated()

                        // 7. Bảo vệ mặc định: Mọi API chưa khai báo bắt buộc phải đăng nhập
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
