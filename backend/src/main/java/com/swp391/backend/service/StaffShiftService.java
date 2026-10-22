package com.swp391.backend.service;

import com.swp391.backend.dto.StaffCurrentShiftResponse;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Shift;
import com.swp391.backend.entity.StaffShift;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.ShiftRepository;
import com.swp391.backend.repository.StaffShiftRepository;
import org.springframework.http.HttpStatus;
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
    private final StaffShiftRepository staffShiftRepository;
    private final ShiftRepository shiftRepository;

    public StaffShiftService(EmployeeProfileRepository employeeProfileRepository,
                             StaffShiftRepository staffShiftRepository,
                             ShiftRepository shiftRepository) {
        this.employeeProfileRepository = employeeProfileRepository;
        this.staffShiftRepository = staffShiftRepository;
        this.shiftRepository = shiftRepository;
    }

    @Transactional(readOnly = true)
    public StaffCurrentShiftResponse getCurrentShift(Integer accountId) {
        EmployeeProfile employee = getEmployee(accountId);
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        return findCurrentAssignment(employee.getEmployeeId(), now, false)
                .map(assignment -> toResponse(assignment.staffShift(), assignment.shift()))
                .orElse(null);
    }

    @Transactional
    public StaffCurrentShiftResponse startCurrentShift(Integer accountId) {
        EmployeeProfile employee = getEmployee(accountId);
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        CurrentAssignment assignment = findCurrentAssignment(employee.getEmployeeId(), now, true)
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

    private EmployeeProfile getEmployee(Integer accountId) {
        if (accountId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return employeeProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Tài khoản không có hồ sơ nhân viên."));
    }

    private java.util.Optional<CurrentAssignment> findCurrentAssignment(
            Integer employeeId, LocalDateTime now, boolean lockRows) {
        LocalDate today = now.toLocalDate();
        List<StaffShift> assignments = lockRows
                ? staffShiftRepository.findAssignedShiftsForUpdate(employeeId, List.of(today, today.minusDays(1)))
                : combineAssignments(employeeId, today);

        List<CurrentAssignment> currentAssignments = new ArrayList<>();
        for (StaffShift assignment : assignments) {
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
