package com.swp391.backend.controller;

import com.swp391.backend.dto.StaffProfileResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Facility;
import com.swp391.backend.entity.Role;
import com.swp391.backend.entity.Shift;
import com.swp391.backend.entity.StaffShift;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.RoleRepository;
import com.swp391.backend.repository.ShiftRepository;
import com.swp391.backend.repository.StaffShiftRepository;
import com.swp391.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/staff")
public class StaffProfileController {

    private final AccountRepository accountRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final FacilityRepository facilityRepository;
    private final StaffShiftRepository staffShiftRepository;
    private final ShiftRepository shiftRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;

    public StaffProfileController(AccountRepository accountRepository,
                                  EmployeeProfileRepository employeeProfileRepository,
                                  FacilityRepository facilityRepository,
                                  StaffShiftRepository staffShiftRepository,
                                  ShiftRepository shiftRepository,
                                  RoleRepository roleRepository,
                                  JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.facilityRepository = facilityRepository;
        this.staffShiftRepository = staffShiftRepository;
        this.shiftRepository = shiftRepository;
        this.roleRepository = roleRepository;
        this.jwtService = jwtService;
    }

    private Account resolveAccount(String authHeader, Long headerAccountId) {
        Long targetId = headerAccountId;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                if (userIdObj instanceof Number) {
                    targetId = ((Number) userIdObj).longValue();
                } else if (userIdObj != null) {
                    targetId = Long.parseLong(userIdObj.toString());
                }
            } catch (Exception ignored) {
            }
        }

        if (targetId != null) {
            Optional<Account> accOpt = accountRepository.findById(targetId);
            if (accOpt.isPresent()) return accOpt.get();
        }

        // Fallback: nhân viên vận hành đầu tiên nếu không có token (hỗ trợ test)
        return accountRepository.findAll().stream()
                .filter(a -> a.getRoleId() != null && (a.getRoleId() == 4L || a.getRoleId() == 3L))
                .findFirst()
                .orElse(null);
    }

    @GetMapping("/profile")
    public ResponseEntity<StaffProfileResponse> getStaffProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Account-Id", required = false) Long headerAccountId,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        Account account = resolveAccount(authHeader, headerAccountId);
        if (account == null) {
            StaffProfileResponse err = new StaffProfileResponse();
            err.setSuccess(false);
            return ResponseEntity.status(401).body(err);
        }

        if (date == null) {
            date = LocalDate.now();
        }

        StaffProfileResponse res = new StaffProfileResponse();
        res.setSuccess(true);
        res.setAccountId(account.getAccountId());
        res.setFullName(account.getFullName());
        res.setPhone(account.getPhone());
        res.setEmail(account.getEmail());
        res.setDate(date.toString());

        // Vai trò: Kéo trực tiếp từ bảng Role trong Database lên
        Long roleId = account.getRoleId();
        String roleStr = "STAFF";
        String roleTitle = "Nhân viên cơ sở";
        if (roleId != null) {
            Optional<Role> roleOpt = roleRepository.findById(roleId.intValue());
            if (roleOpt.isPresent()) {
                Role r = roleOpt.get();
                roleStr = r.getRoleName();
                roleTitle = r.getRoleTitle() != null ? r.getRoleTitle() : r.getRoleName();
            }
        }
        res.setRole(roleStr);
        res.setRoleTitle(roleTitle);

        // Hồ sơ nhân viên & cơ sở
        Optional<EmployeeProfile> empOpt = employeeProfileRepository.findByAccountId(account.getAccountId());
        Integer employeeId = empOpt.map(EmployeeProfile::getEmployeeId).orElse(null);
        Integer facilityId = empOpt.map(EmployeeProfile::getFacilityId).orElse(null);

        res.setEmployeeId(employeeId);
        res.setFacilityId(facilityId);

        String codePrefix = "MANAGER".equals(roleStr) ? "QL-" : "NV-";
        res.setStaffCode(codePrefix + String.format("%04d", employeeId != null ? employeeId : account.getAccountId()));

        if (facilityId != null) {
            Optional<Facility> facOpt = facilityRepository.findById(facilityId);
            if (facOpt.isPresent()) {
                res.setFacilityCode(facOpt.get().getFacilityCode());
                res.setFacilityName(facOpt.get().getFacilityName());
                res.setFacilityAddress(facOpt.get().getAddress());
            }
        }
        if (res.getFacilityCode() == null) {
            res.setFacilityCode("HN-01");
        }
        if (res.getFacilityName() == null) {
            res.setFacilityName("SmartStorage Cầu Giấy");
        }

        // Lấy danh sách ca trực được Quản lý phân công
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        LocalTime nowTime = LocalTime.now();

        List<Shift> allActiveShifts = shiftRepository.findByStatusOrderByStartTimeAsc("ACTIVE");
        Map<Integer, Shift> shiftMap = new HashMap<>();
        for (Shift s : allActiveShifts) {
            shiftMap.put(s.getShiftId(), s);
        }

        List<StaffProfileResponse.AssignedShiftDto> assignedList = new ArrayList<>();
        boolean isCurrentlyInShift = false;
        boolean hasUpcomingShift = false;
        boolean allEnded = false;

        if (employeeId != null) {
            List<StaffShift> staffShifts = staffShiftRepository.findByEmployeeIdAndWorkDateAndStatusNot(employeeId, date, "CANCELLED");

            for (StaffShift ss : staffShifts) {
                Shift s = shiftMap.get(ss.getShiftId());
                if (s != null) {
                    boolean isAttended = "ATTENDED".equalsIgnoreCase(ss.getStatus());
                    boolean isScheduled = "SCHEDULED".equalsIgnoreCase(ss.getStatus());

                    boolean current = false;
                    if (isAttended) {
                        current = !nowTime.isBefore(s.getStartTime().minusMinutes(30));
                    } else if (isScheduled) {
                        current = !nowTime.isBefore(s.getStartTime().minusMinutes(30)) && !nowTime.isAfter(s.getEndTime());
                    }

                    if (current) {
                        isCurrentlyInShift = true;
                    }
                    if (isScheduled && nowTime.isBefore(s.getStartTime().minusMinutes(30))) {
                        hasUpcomingShift = true;
                    }
                    assignedList.add(new StaffProfileResponse.AssignedShiftDto(
                            s.getShiftId(),
                            s.getShiftName(),
                            s.getStartTime().format(timeFmt),
                            s.getEndTime().format(timeFmt),
                            current,
                            ss.getStatus()
                    ));
                }
            }
        }

        res.setAssignedShifts(assignedList);

        if (assignedList.isEmpty()) {
            res.setShiftStatus("NO_SHIFT");
            res.setShiftStatusText("Hôm nay chưa có phân ca");
        } else if (isCurrentlyInShift) {
            res.setShiftStatus("IN_SHIFT");
            res.setShiftStatusText("Đang trong ca trực");
        } else if (hasUpcomingShift) {
            res.setShiftStatus("UPCOMING");
            res.setShiftStatusText("Chưa đến ca trực");
        } else {
            res.setShiftStatus("ENDED");
            res.setShiftStatusText("Đã hết ca trực");
        }

        return ResponseEntity.ok(res);
    }
}
