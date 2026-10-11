package com.swp391.backend.service;

import com.swp391.backend.dto.ManualGateOpenRequest;
import com.swp391.backend.entity.AuditLog;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.repository.AuditLogRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private static final String MANUAL_GATE_OPEN = "MANUAL_GATE_OPEN";

    private final AuditLogRepository auditLogRepository;
    private final EmployeeProfileRepository employeeProfileRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            EmployeeProfileRepository employeeProfileRepository) {
        this.auditLogRepository = auditLogRepository;
        this.employeeProfileRepository = employeeProfileRepository;
    }

    @Transactional
    public AuditLog recordManualGateOpen(Integer accountId, ManualGateOpenRequest request) {

        if (accountId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated");
        }

        EmployeeProfile employee = employeeProfileRepository
                .findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Employee profile not found"));

        if (request == null
                || request.getCustomerId() == null
                || request.getOpenedAt() == null
                || request.getReason() == null
                || request.getReason().isBlank()
                || request.getReason().length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Customer ID, opening time and valid reason are required");
        }

        AuditLog log = new AuditLog();
        log.setAccountId(accountId);
        log.setFacilityId(employee.getFacilityId());
        log.setCustomerId(request.getCustomerId());
        log.setAction(MANUAL_GATE_OPEN);
        log.setOpenedAt(request.getOpenedAt());
        log.setReason(request.getReason().trim());
        log.setCreatedAt(LocalDateTime.now());

        return auditLogRepository.save(log);
    }

    public List<AuditLog> getManualGateOpenLogs(Integer accountId) {

        if (accountId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "User is not authenticated");
        }

        EmployeeProfile employee = employeeProfileRepository
                .findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Employee profile not found"));

        return auditLogRepository
                .findByFacilityIdAndActionOrderByCreatedAtDesc(
                        employee.getFacilityId(),
                        "MANUAL_GATE_OPEN");
    }
}
