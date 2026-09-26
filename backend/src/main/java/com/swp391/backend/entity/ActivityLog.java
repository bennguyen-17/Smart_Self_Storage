package com.swp391.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity 
@Table (name = "ActivityLog")
public class ActivityLog {

    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long activityLogId;

    @Column (nullable = false)
    private Long accountId;

    @Column(nullable = false, columnDefinition = "NVARCHAR(50)")
    private String action;

    @Column(columnDefinition = "NVARCHAR(500)")
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(columnDefinition = "NVARCHAR(50)")
    private String ipAddress;

    

    

}