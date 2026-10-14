package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.AssignShiftRequest;
import com.swp391.backend.dto.ManagerStaffResponse;
import com.swp391.backend.dto.ShiftScheduleResponse;
import com.swp391.backend.service.ManagerShiftService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/manager")
public class ManagerShiftController {

    private final ManagerShiftService managerShiftService;

    public ManagerShiftController(ManagerShiftService managerShiftService) {
        this.managerShiftService = managerShiftService;
    }

    // --- 1. GET /api/manager/staff: Danh sách nhân viên của cơ sở ---
    @GetMapping("/staff")
    public ResponseEntity<List<ManagerStaffResponse>> getFacilityStaff(
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId) {
        return ResponseEntity.ok(managerShiftService.getFacilityStaff(facilityId));
    }

    // --- 2. GET /api/manager/shifts?date=YYYY-MM-DD: Các ca trong ngày và ai đang trực ---
    @GetMapping("/shifts")
    public ResponseEntity<ShiftScheduleResponse> getShiftSchedule(
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return ResponseEntity.ok(managerShiftService.getShiftSchedule(facilityId, date));
    }

    // --- 3. PUT /api/manager/shifts/{date}/{shiftId}: Lưu danh sách người trực của 1 ca ---
    @PutMapping("/shifts/{date}/{shiftId}")
    public ResponseEntity<?> assignShift(
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PathVariable Integer shiftId,
            @RequestBody AssignShiftRequest request) {
        try {
            ShiftScheduleResponse response = managerShiftService.assignShift(
                    facilityId,
                    date,
                    shiftId,
                    request.getEmployeeIds()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(new ApiResponse(false, "Lỗi phân ca: " + ex.getMessage()));
        }
    }
}
