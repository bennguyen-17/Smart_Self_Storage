package com.swp391.backend.service;

import com.swp391.backend.dto.StaffCurrentShiftResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Shift;
import com.swp391.backend.entity.StaffShift;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ShiftRepository;
import com.swp391.backend.repository.StaffShiftRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class StaffShiftService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    private final EmployeeProfileRepository employeeProfileRepository;
    private final AccountRepository accountRepository;
    private final StaffShiftRepository staffShiftRepository;
    private final ShiftRepository shiftRepository;

    public StaffShiftService(EmployeeProfileRepository employeeProfileRepository,
                             AccountRepository accountRepository,
                             StaffShiftRepository staffShiftRepository,
                             ShiftRepository shiftRepository) {
        this.employeeProfileRepository = employeeProfileRepository;
        this.accountRepository = accountRepository;
        this.staffShiftRepository = staffShiftRepository;
        this.shiftRepository = shiftRepository;
    }

    @Transactional(readOnly = true)
    public StaffCurrentShiftResponse getCurrentShift(Integer accountId) {
        EmployeeProfile employee = getEmployee(accountId);
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        return findCurrentAssignment(employee.getEmployeeId(), employee.getFacilityId(), now, false)
                .map(assignment -> toResponse(assignment.staffShift(), assignment.shift()))
                .orElse(null);
    }

    @Transactional
    public StaffCurrentShiftResponse startCurrentShift(Integer accountId) {
        EmployeeProfile employee = getEmployee(accountId);
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        CurrentAssignment assignment = findCurrentAssignment(
                employee.getEmployeeId(), employee.getFacilityId(), now, true)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Không có ca được phân công đang trong giờ để bắt đầu."));

        StaffShift staffShift = assignment.staffShift();
        if ("SCHEDULED".equalsIgnoreCase(staffShift.getStatus())) {
            staffShift.setStatus("ATTENDED");
            staffShift = staffShiftRepository.save(staffShift);
        } else if (!"ATTENDED".equalsIgnoreCase(staffShift.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ca này không ở trạng thái có thể bắt đầu.");
        }

        return toResponse(staffShift, assignment.shift());
    }

    @Transactional(readOnly = true)
    public Integer requireOnDutyFacility(Integer accountId) {
        if (accountId == null) {
            throw new AccessDeniedException("Tài khoản Staff chưa được xác thực.");
        }
        Account account = accountRepository.findAccountByAccountId(accountId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy tài khoản Staff."));
        if (!Long.valueOf(4L).equals(account.getRoleId())) {
            throw new AccessDeniedException("Chức năng này chỉ dành cho Staff.");
        }
        EmployeeProfile employee = employeeProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy hồ sơ Staff."));
        requireCurrentAttendedShift(accountId);
        return employee.getFacilityId();
    }

    @Transactional(readOnly = true)
    public StaffShift requireCurrentAttendedShift(Integer accountId) {
        EmployeeProfile employee = getEmployee(accountId);
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        CurrentAssignment assignment = findCurrentAssignment(
                employee.getEmployeeId(), employee.getFacilityId(), now, false)
                .orElseThrow(() -> new AccessDeniedException(
                        "Staff phải bắt đầu ca được phân công trước khi xử lý công việc."));
        if (!"ATTENDED".equalsIgnoreCase(assignment.staffShift().getStatus())) {
            throw new AccessDeniedException("Staff phải bắt đầu ca được phân công trước khi xử lý công việc.");
        }
        return assignment.staffShift();
    }

    @Transactional(readOnly = true)
    public List<Integer> getOnDutyStaffAccountIds(Integer facilityId) {
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        List<StaffShift> assignments = combineFacilityAssignments(facilityId, now.toLocalDate());
        return assignments.stream()
                .filter(assignment -> "ATTENDED".equalsIgnoreCase(assignment.getStatus()))
                .filter(assignment -> {
                    Shift shift = shiftRepository.findById(assignment.getShiftId()).orElse(null);
                    return shift != null && "ACTIVE".equalsIgnoreCase(shift.getStatus())
                            && isWithinShift(assignment, shift, now);
                })
                .map(StaffShift::getEmployeeId)
                .distinct()
                .map(employeeId -> employeeProfileRepository.findById(employeeId).orElse(null))
                .filter(employee -> employee != null && facilityId.equals(employee.getFacilityId()))
                .map(EmployeeProfile::getAccountId)
                .filter(accountId -> accountRepository.findAccountByAccountId(accountId)
                        .map(account -> Long.valueOf(4L).equals(account.getRoleId())
                                && "ACTIVE".equalsIgnoreCase(account.getStatus()))
                        .orElse(false))
                .sorted()
                .toList();
    }

    private EmployeeProfile getEmployee(Integer accountId) {
        if (accountId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return employeeProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Tài khoản không có hồ sơ nhân viên."));
    }

    private java.util.Optional<CurrentAssignment> findCurrentAssignment(
            Integer employeeId, Integer facilityId, LocalDateTime now, boolean lockRows) {
        LocalDate today = now.toLocalDate();
        List<StaffShift> assignments = lockRows
                ? staffShiftRepository.findAssignedShiftsForUpdate(employeeId, List.of(today, today.minusDays(1)))
                : combineAssignments(employeeId, today);

        List<CurrentAssignment> currentAssignments = new ArrayList<>();
        for (StaffShift assignment : assignments) {
            if (!facilityId.equals(assignment.getFacilityId())) {
                continue;
            }
            if (!"SCHEDULED".equalsIgnoreCase(assignment.getStatus())
                    && !"ATTENDED".equalsIgnoreCase(assignment.getStatus())) {
                continue;
            }
            Shift shift = shiftRepository.findById(assignment.getShiftId()).orElse(null);
            if (shift == null || !"ACTIVE".equalsIgnoreCase(shift.getStatus()) || !isWithinShift(assignment, shift, now)) {
                continue;
            }
            currentAssignments.add(new CurrentAssignment(assignment, shift));
        }

        return currentAssignments.stream()
                .sorted(Comparator
                        .comparing((CurrentAssignment item) -> "ATTENDED".equalsIgnoreCase(item.staffShift().getStatus()) ? 0 : 1)
                        .thenComparing(item -> item.staffShift().getStaffShiftId()))
                .findFirst();
    }

    private List<StaffShift> combineAssignments(Integer employeeId, LocalDate today) {
        List<StaffShift> assignments = new ArrayList<>(staffShiftRepository
                .findByEmployeeIdAndWorkDateAndStatusNot(employeeId, today, "CANCELLED"));
        assignments.addAll(staffShiftRepository
                .findByEmployeeIdAndWorkDateAndStatusNot(employeeId, today.minusDays(1), "CANCELLED"));
        return assignments;
    }

    private List<StaffShift> combineFacilityAssignments(Integer facilityId, LocalDate today) {
        List<StaffShift> assignments = new ArrayList<>(staffShiftRepository
                .findByFacilityIdAndWorkDateAndStatusNot(facilityId, today, "CANCELLED"));
        assignments.addAll(staffShiftRepository
                .findByFacilityIdAndWorkDateAndStatusNot(facilityId, today.minusDays(1), "CANCELLED"));
        return assignments;
    }

    private boolean isWithinShift(StaffShift assignment, Shift shift, LocalDateTime now) {
        LocalTime start = shift.getStartTime();
        LocalTime end = shift.getEndTime();
        LocalDateTime startAt;
        LocalDateTime endAt;

        if (end.isAfter(start)) {
            if (!assignment.getWorkDate().equals(now.toLocalDate())) {
                return false;
            }
            startAt = assignment.getWorkDate().atTime(start);
            endAt = assignment.getWorkDate().atTime(end);
        } else if (end.isBefore(start)) {
            startAt = assignment.getWorkDate().atTime(start);
            endAt = assignment.getWorkDate().plusDays(1).atTime(end);
        } else {
            return false;
        }

        return !now.isBefore(startAt) && now.isBefore(endAt);
    }

    private StaffCurrentShiftResponse toResponse(StaffShift staffShift, Shift shift) {
        return new StaffCurrentShiftResponse(
                shift.getShiftId(),
                shift.getShiftName(),
                shift.getStartTime().format(TIME_FORMAT),
                shift.getEndTime().format(TIME_FORMAT),
                "ATTENDED".equalsIgnoreCase(staffShift.getStatus()));
    }

    private record CurrentAssignment(StaffShift staffShift, Shift shift) {
    }
}
