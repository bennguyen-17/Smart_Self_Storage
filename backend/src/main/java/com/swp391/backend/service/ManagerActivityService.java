package com.swp391.backend.service;

import com.swp391.backend.dto.AdminActivityLogResponse;
import com.swp391.backend.dto.ManagerStaffActivityResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Shift;
import com.swp391.backend.entity.StaffShift;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.ShiftRepository;
import com.swp391.backend.repository.StaffShiftRepository;
import com.swp391.backend.repository.StaffTaskRepository;
import com.swp391.backend.repository.SupportTicketRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ManagerActivityService {

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
    private static final List<String> COUNTED_ACTIONS = List.of(
            "STAFF_RESERVATION_CHECK_IN",
            "CONFIRM_CHECKOUT_TERMINATED",
            "RESOLVE_TICKET",
            "RESOLVE_UNLOCK_TICKET",
            "COMPLETE_MAINTENANCE");

    private final EmployeeProfileRepository employeeProfileRepository;
    private final AccountRepository accountRepository;
    private final ShiftRepository shiftRepository;
    private final StaffShiftRepository staffShiftRepository;
    private final ActivityLogRepository activityLogRepository;
    private final StaffTaskRepository staffTaskRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final FacilityRepository facilityRepository;

    public ManagerActivityService(EmployeeProfileRepository employeeProfileRepository,
                                  AccountRepository accountRepository,
                                  ShiftRepository shiftRepository,
                                  StaffShiftRepository staffShiftRepository,
                                  ActivityLogRepository activityLogRepository,
                                  StaffTaskRepository staffTaskRepository,
                                  SupportTicketRepository supportTicketRepository,
                                  FacilityRepository facilityRepository) {
        this.employeeProfileRepository = employeeProfileRepository;
        this.accountRepository = accountRepository;
        this.shiftRepository = shiftRepository;
        this.staffShiftRepository = staffShiftRepository;
        this.activityLogRepository = activityLogRepository;
        this.staffTaskRepository = staffTaskRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.facilityRepository = facilityRepository;
    }

    @Transactional(readOnly = true)
    public ManagerStaffActivityResponse getStaffActivity(Integer managerAccountId, Integer requestedFacilityId,
                                                         LocalDate date) {
        EmployeeProfile manager = requireManagerFacility(managerAccountId, requestedFacilityId);
        List<StaffShift> assignments = staffShiftRepository.findByFacilityIdAndWorkDateAndStatusNot(
                manager.getFacilityId(), date, "CANCELLED");

        Map<Integer, List<StaffShift>> assignmentsByShift = new HashMap<>();
        for (StaffShift assignment : assignments) {
            assignmentsByShift.computeIfAbsent(assignment.getShiftId(), ignored -> new ArrayList<>()).add(assignment);
        }

        List<ManagerStaffActivityResponse.ShiftActivity> shiftResults = new ArrayList<>();
        for (Shift shift : shiftRepository.findByStatusOrderByStartTimeAsc("ACTIVE")) {
            List<StaffShift> shiftAssignments = assignmentsByShift.getOrDefault(shift.getShiftId(), List.of());
            shiftResults.add(buildShiftActivity(manager.getFacilityId(), date, shift, shiftAssignments));
        }
        return new ManagerStaffActivityResponse(date, shiftResults);
    }

    private ManagerStaffActivityResponse.ShiftActivity buildShiftActivity(Integer facilityId, LocalDate date,
                                                                           Shift shift,
                                                                           List<StaffShift> assignments) {
        LocalDateTime from = date.atTime(shift.getStartTime());
        LocalDate endDate = shift.getEndTime().compareTo(shift.getStartTime()) <= 0
                ? date.plusDays(1) : date;
        LocalDateTime to = endDate.atTime(shift.getEndTime());

        List<Integer> assignedEmployeeIds = assignments.stream()
                .map(StaffShift::getEmployeeId).distinct().toList();
        Map<Integer, EmployeeProfile> employeesById = new LinkedHashMap<>();
        for (EmployeeProfile employee : employeeProfileRepository.findAllById(assignedEmployeeIds)) {
            if (Objects.equals(employee.getFacilityId(), facilityId)) {
                employeesById.put(employee.getEmployeeId(), employee);
            }
        }
        List<EmployeeProfile> employees = new ArrayList<>(employeesById.values());

        List<Integer> accountIds = employees.stream().map(EmployeeProfile::getAccountId).distinct().toList();
        Map<Integer, Account> accountsById = new HashMap<>();
        if (!accountIds.isEmpty()) {
            List<Long> accountLongIds = accountIds.stream().map(Long::valueOf).toList();
            for (Account account : accountRepository.findAllById(accountLongIds)) {
                if (Long.valueOf(4L).equals(account.getRoleId())) {
                    accountsById.put(account.getAccountId(), account);
                }
            }
        }

        Map<Integer, Map<String, Long>> actionCounts = new HashMap<>();
        Map<Integer, Long> taskCounts = new HashMap<>();
        Map<Integer, Double> averageAcceptMinutes = new HashMap<>();
        if (!accountIds.isEmpty()) {
            for (Object[] row : activityLogRepository.countActionsByStaffAndShift(
                    facilityId, accountIds, COUNTED_ACTIONS, from, to)) {
                Integer accountId = ((Number) row[0]).intValue();
                String action = (String) row[1];
                long count = ((Number) row[2]).longValue();
                actionCounts.computeIfAbsent(accountId, ignored -> new HashMap<>()).put(action, count);
            }

            List<Integer> employeeIds = employees.stream().map(EmployeeProfile::getEmployeeId).toList();
            for (Object[] row : staffTaskRepository.countDoneTasksByEmployeeAndShift(
                    facilityId, date, shift.getShiftId(), employeeIds)) {
                taskCounts.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
            }

            for (Object[] row : supportTicketRepository.findAverageAcceptMinutesByStaffAndShift(
                    facilityId, accountIds, from, to)) {
                Integer accountId = ((Number) row[0]).intValue();
                double average = ((Number) row[1]).doubleValue();
                averageAcceptMinutes.put(accountId, Math.round(average * 100.0) / 100.0);
            }
        }

        List<ManagerStaffActivityResponse.StaffActivity> staffResults = new ArrayList<>();
        for (StaffShift assignment : assignments) {
            EmployeeProfile employee = employeesById.get(assignment.getEmployeeId());
            if (employee == null || !Objects.equals(employee.getFacilityId(), facilityId)) continue;
            Account account = accountsById.get(employee.getAccountId());
            if (account == null) continue;

            Map<String, Long> counts = actionCounts.getOrDefault(account.getAccountId(), Map.of());
            ManagerStaffActivityResponse.StaffActivity staff = new ManagerStaffActivityResponse.StaffActivity();
            staff.setEmployeeId(employee.getEmployeeId());
            staff.setAccountId(account.getAccountId());
            staff.setFullName(account.getFullName());
            staff.setAttended("ATTENDED".equalsIgnoreCase(assignment.getStatus()));
            staff.setCheckIns(counts.getOrDefault("STAFF_RESERVATION_CHECK_IN", 0L));
            staff.setCheckouts(counts.getOrDefault("CONFIRM_CHECKOUT_TERMINATED", 0L));
            staff.setTicketsResolved(counts.getOrDefault("RESOLVE_TICKET", 0L)
                    + counts.getOrDefault("RESOLVE_UNLOCK_TICKET", 0L));
            staff.setMaintenanceDone(counts.getOrDefault("COMPLETE_MAINTENANCE", 0L));
            staff.setTasksDone(taskCounts.getOrDefault(employee.getEmployeeId(), 0L));
            staff.setAvgTicketAcceptMinutes(averageAcceptMinutes.get(account.getAccountId()));
            staffResults.add(staff);
        }

        return new ManagerStaffActivityResponse.ShiftActivity(
                shift.getShiftId(), shift.getShiftName(), shift.getStartTime().format(TIME_FORMAT),
                shift.getEndTime().format(TIME_FORMAT), staffResults);
    }

    @Transactional(readOnly = true)
    public List<AdminActivityLogResponse> getActivityLogs(Integer managerAccountId, Integer requestedFacilityId,
                                                           LocalDate date, Integer accountId) {
        EmployeeProfile manager = requireManagerFacility(managerAccountId, requestedFacilityId);
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();
        List<ActivityLog> logs = accountId == null
                ? activityLogRepository.findByFacilityIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        manager.getFacilityId(), from, to)
                : activityLogRepository.findByFacilityIdAndAccountIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
                        manager.getFacilityId(), accountId, from, to);

        List<AdminActivityLogResponse> response = new ArrayList<>();
        for (ActivityLog log : logs) {
            Account actor = accountRepository.findById(Long.valueOf(log.getAccountId())).orElse(null);
            String facilityCode = facilityRepository.findById(log.getFacilityId())
                    .map(facility -> facility.getFacilityCode()).orElse(null);
            response.add(new AdminActivityLogResponse(
                    log.getActivityLogId(), log.getAccountId(), log.getFacilityId(), facilityCode,
                    actor == null ? "Hệ thống" : actor.getFullName(),
                    actor == null ? "SYSTEM" : mapRoleIdToName(actor.getRoleId()),
                    log.getAction(), log.getDescription(), log.getCreatedAt(), log.getIpAddress()));
        }
        return response;
    }

    private EmployeeProfile requireManagerFacility(Integer managerAccountId, Integer requestedFacilityId) {
        if (managerAccountId == null) {
            throw new AccessDeniedException("Tài khoản Manager chưa được xác thực.");
        }
        Account account = accountRepository.findAccountByAccountId(managerAccountId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy tài khoản Manager."));
        if (!Long.valueOf(3L).equals(account.getRoleId()) || !"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new AccessDeniedException("Tài khoản không có quyền Manager hoạt động.");
        }
        EmployeeProfile manager = employeeProfileRepository.findByAccountId(managerAccountId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy hồ sơ Manager."));
        if (requestedFacilityId == null || !Objects.equals(manager.getFacilityId(), requestedFacilityId)) {
            throw new AccessDeniedException("Cơ sở yêu cầu không thuộc quyền quản lý của tài khoản.");
        }
        return manager;
    }

    private String mapRoleIdToName(Long roleId) {
        if (roleId == null) return "UNKNOWN";
        return switch (roleId.intValue()) {
            case 1 -> "ADMIN";
            case 2 -> "BOM";
            case 3 -> "MANAGER";
            case 4 -> "STAFF";
            case 5 -> "CUSTOMER";
            default -> "USER";
        };
    }
}
