package com.swp391.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor 
@AllArgsConstructor 
@Data 
@Builder
@Entity
@Table(name = "account")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    @Column(nullable = false, unique = true, columnDefinition = "NVARCHAR(255)")
    private String email;

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String password;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String fullName;

    @Column(unique = true, columnDefinition = "NVARCHAR(20)")
    private String phone;

    private Long roleId;

    @Builder.Default 
    @Column(columnDefinition = "NVARCHAR(30)")
    private String status = "ACTIVE";

    @Builder.Default 
    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer failedAttempts = 0;

    private LocalDateTime firstFailedAt;

    private LocalDateTime lockUntil;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;



}