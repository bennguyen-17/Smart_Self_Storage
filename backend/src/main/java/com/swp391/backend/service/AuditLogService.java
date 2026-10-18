package com.swp391.backend.service;

import com.swp391.backend.dto.ManualGateOpenRequest;
import com.swp391.backend.entity.AuditLog;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.repository.AuditLogRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.CustomerProfileRepository;

import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.FacilityRepository;

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
    private final CustomerProfileRepository customerProfileRepository;
    private final AccountRepository accountRepository;
    private final FacilityRepository facilityRepository;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            EmployeeProfileRepository employeeProfileRepository,
            CustomerProfileRepository customerProfileRepository,
            AccountRepository accountRepository,
            FacilityRepository facilityRepository) {
        this.auditLogRepository = auditLogRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.accountRepository = accountRepository;
        this.facilityRepository = facilityRepository;
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

        customerProfileRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Customer not found"));

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

    public void enrichAuditLog(AuditLog log) {
        if (log == null) return;

        // 1. Tên cơ sở
        if (log.getFacilityId() != null && facilityRepository != null) {
            try {
                facilityRepository.findById(log.getFacilityId()).ifPresent(f -> {
                    log.setFacilityName(f.getFacilityName());
                });
            } catch (Exception ignored) {}
        }

        // 2. Tên cổng & Phương thức từ action & reason
        String act = log.getAction() != null ? log.getAction() : "";
        String rsn = log.getReason() != null ? log.getReason() : "";

        // Trích xuất tên cổng: ví dụ "GATE_ACCESS_GRANTED - HN-01 Cổng Chính" -> "Cổng Chính"
        if (act.contains(" - ")) {
            String[] parts = act.split(" - ");
            if (parts.length > 1) {
                String sub = parts[1].trim();
                sub = sub.replaceAll("^[A-Z0-9-]+[\\s:]+", "");
                log.setGateName(sub);
            }
        }
        if (log.getGateName() == null || log.getGateName().isBlank()) {
            if (act.toLowerCase().contains("xe tải") || rsn.toLowerCase().contains("xe tải")) {
                log.setGateName("Cổng Xe Tải");
            } else if (act.toLowerCase().contains("vip") || rsn.toLowerCase().contains("vip")) {
                log.setGateName("Cổng VIP");
            } else if (act.toLowerCase().contains("thang máy") || rsn.toLowerCase().contains("thang máy")) {
                log.setGateName("Thang máy hàng");
            } else {
                log.setGateName("Cổng Chính");
            }
        }

        // Phương thức mở
        if (act.toUpperCase().contains("MANUAL") || rsn.toLowerCase().contains("thẻ master") || rsn.toLowerCase().contains("thủ công") || rsn.toLowerCase().contains("chìa cơ")) {
            log.setAccessMethod("Thẻ Master thủ công");
        } else {
            log.setAccessMethod("Mã PIN động IoT");
        }

        // 3. Thông tin người ra vào (Khách hàng hoặc Người quẹt thẻ)
        if (log.getCustomerId() != null) {
            try {
                customerProfileRepository.findById(log.getCustomerId()).ifPresent(cp -> {
                    log.setIdentityNumber(cp.getIdentityNumber());
                    if (cp.getAccountId() != null) {
                        accountRepository.findById(Long.valueOf(cp.getAccountId())).ifPresent(acc -> {
                            log.setPersonName(acc.getFullName());
                            log.setPersonPhone(acc.getPhone());
                            log.setPersonRole("Khách hàng");
                        });
                    }
                });
                if (log.getPersonName() == null) {
                    accountRepository.findById(Long.valueOf(log.getCustomerId())).ifPresent(acc -> {
                        log.setPersonName(acc.getFullName());
                        log.setPersonPhone(acc.getPhone());
                        log.setPersonRole("Khách hàng");
                    });
                }
            } catch (Exception ignored) {}
        }

        // Nếu người mở là Nhân viên (accountId):
        if (log.getAccountId() != null) {
            try {
                accountRepository.findById(Long.valueOf(log.getAccountId())).ifPresent(acc -> {
                    String roleTitle = "Nhân viên";
                    if (Long.valueOf(1L).equals(acc.getRoleId())) roleTitle = "Quản trị viên";
                    else if (Long.valueOf(3L).equals(acc.getRoleId())) roleTitle = "Quản lý cơ sở";
                    else if (Long.valueOf(4L).equals(acc.getRoleId())) roleTitle = "Nhân viên trực ca";
                    else if (Long.valueOf(5L).equals(acc.getRoleId())) roleTitle = "Khách hàng";

                    boolean isManualAct = act.toUpperCase().contains("MANUAL") || rsn.toLowerCase().contains("thẻ master") || rsn.toLowerCase().contains("thủ công");
                    if (isManualAct && !Long.valueOf(5L).equals(acc.getRoleId())) {
                        log.setStaffName(acc.getFullName());
                    }

                    if (log.getPersonName() == null) {
                        log.setPersonName(acc.getFullName());
                        log.setPersonPhone(acc.getPhone());
                        log.setPersonRole(roleTitle);
                    }
                });
            } catch (Exception ignored) {}
        }

        if (log.getPersonName() == null) {
            log.setPersonName(log.getCustomerId() != null ? "Khách hàng #" + log.getCustomerId() : "Người dùng ra vào");
            log.setPersonRole("Khách hàng");
        }
    }

    public List<AuditLog> getGateLogs(Integer accountId, Integer facilityId, String method) {
        Integer targetFacilityId = facilityId;
        if (targetFacilityId == null && accountId != null) {
            targetFacilityId = employeeProfileRepository.findByAccountId(accountId)
                    .map(EmployeeProfile::getFacilityId)
                    .orElse(null);
        }

        List<AuditLog> logs;
        if (targetFacilityId != null && targetFacilityId > 0) {
            logs = auditLogRepository.findByFacilityIdOrderByOpenedAtDesc(targetFacilityId);
            if (logs.isEmpty()) {
                logs = auditLogRepository.findAllByOrderByOpenedAtDesc();
            }
        } else {
            logs = auditLogRepository.findAllByOrderByOpenedAtDesc();
        }

        if (method != null && !method.isBlank() && !"ALL".equalsIgnoreCase(method)) {
            if ("MANUAL".equalsIgnoreCase(method)) {
                logs = logs.stream()
                        .filter(l -> (l.getAction() != null && l.getAction().toUpperCase().contains("MANUAL"))
                                || (l.getReason() != null && l.getReason().toLowerCase().contains("thẻ master")))
                        .toList();
            } else if ("PIN".equalsIgnoreCase(method)) {
                logs = logs.stream()
                        .filter(l -> l.getAction() != null && l.getAction().toUpperCase().startsWith("GATE_ACCESS"))
                        .toList();
            }
        }

        for (AuditLog log : logs) {
            enrichAuditLog(log);
        }

        return logs;
    }

    public List<AuditLog> getManualGateOpenLogs(Integer accountId) {
        return getGateLogs(accountId, null, null);
    }
}
