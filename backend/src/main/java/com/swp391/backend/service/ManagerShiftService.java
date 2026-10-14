package com.swp391.backend.service;

import com.swp391.backend.dto.ManagerStaffResponse;
import com.swp391.backend.dto.ShiftScheduleResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Shift;
import com.swp391.backend.entity.StaffShift;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.ShiftRepository;
import com.swp391.backend.repository.StaffShiftRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ManagerShiftService {

    private final EmployeeProfileRepository employeeProfileRepository;
    private final AccountRepository accountRepository;
    private final ShiftRepository shiftRepository;
    private final StaffShiftRepository staffShiftRepository;

    public ManagerShiftService(EmployeeProfileRepository employeeProfileRepository,
                               AccountRepository accountRepository,
                               ShiftRepository shiftRepository,
                               StaffShiftRepository staffShiftRepository) {
        this.employeeProfileRepository = employeeProfileRepository;
        this.accountRepository = accountRepository;
        this.shiftRepository = shiftRepository;
        this.staffShiftRepository = staffShiftRepository;
    }

    // 1. GET /api/manager/staff: Danh sách nhân viên của cơ sở
    public List<ManagerStaffResponse> getFacilityStaff(Integer facilityId) {
        if (facilityId == null) {
            return Collections.emptyList();
        }

        List<EmployeeProfile> employees = employeeProfileRepository.findByFacilityId(facilityId);
        List<ManagerStaffResponse> result = new ArrayList<>();

        for (EmployeeProfile emp : employees) {
            Optional<Account> accOpt = accountRepository.findById(Long.valueOf(emp.getAccountId()));
            if (accOpt.isPresent()) {
                Account acc = accOpt.get();
                result.add(new ManagerStaffResponse(
                        emp.getEmployeeId(),
                        acc.getFullName(),
                        acc.getPhone(),
                        emp.getFacilityId(),
                        acc.getStatus()
                ));
            }
        }
        return result;
    }

    // 2. GET /api/manager/shifts?date=YYYY-MM-DD: Các ca trong ngày và ai đang trực
    @Transactional
    public ShiftScheduleResponse getShiftSchedule(Integer facilityId, LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }

        List<Shift> shifts = shiftRepository.findByStatusOrderByStartTimeAsc("ACTIVE");

        List<StaffShift> staffShifts = Collections.emptyList();
        if (facilityId != null) {
            staffShifts = staffShiftRepository.findByFacilityIdAndWorkDateAndStatusNot(facilityId, date, "CANCELLED");
        }

        // Tạo map: shiftId -> list of staff
        Map<Integer, List<ShiftScheduleResponse.StaffMemberDto>> shiftStaffMap = new HashMap<>();
        for (Shift s : shifts) {
            shiftStaffMap.put(s.getShiftId(), new ArrayList<>());
        }

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        for (StaffShift ss : staffShifts) {
            if (shiftStaffMap.containsKey(ss.getShiftId())) {
                Optional<EmployeeProfile> empOpt = employeeProfileRepository.findById(ss.getEmployeeId());
                String fullName = "Nhân viên #" + ss.getEmployeeId();
                if (empOpt.isPresent()) {
                    Optional<Account> accOpt = accountRepository.findById(Long.valueOf(empOpt.get().getAccountId()));
                    if (accOpt.isPresent()) {
                        fullName = accOpt.get().getFullName();
                    }
                }
                shiftStaffMap.get(ss.getShiftId()).add(new ShiftScheduleResponse.StaffMemberDto(ss.getEmployeeId(), fullName));
            }
        }

        List<ShiftScheduleResponse.ShiftDetailDto> shiftDetails = new ArrayList<>();
        for (Shift s : shifts) {
            shiftDetails.add(new ShiftScheduleResponse.ShiftDetailDto(
                    s.getShiftId(),
                    s.getShiftName(),
                    s.getStartTime().format(timeFmt),
                    s.getEndTime().format(timeFmt),
                    shiftStaffMap.getOrDefault(s.getShiftId(), new ArrayList<>())
            ));
        }

        return new ShiftScheduleResponse(date.toString(), shiftDetails);
    }

    // 3. PUT /api/manager/shifts/{date}/{shiftId}: Lưu danh sách người trực của 1 ca
    @Transactional
    public ShiftScheduleResponse assignShift(Integer facilityId, LocalDate date, Integer shiftId, List<Integer> employeeIds) {
        if (facilityId == null) {
            throw new IllegalArgumentException("Thiếu Header X-Facility-Id của cơ sở!");
        }
        if (date == null) {
            date = LocalDate.now();
        }
        if (employeeIds == null) {
            employeeIds = Collections.emptyList();
        }

        // Kiểm tra xem tất cả nhân viên có thuộc cơ sở này không
        for (Integer empId : employeeIds) {
            Optional<EmployeeProfile> empOpt = employeeProfileRepository.findById(empId);
            if (empOpt.isEmpty() || !facilityId.equals(empOpt.get().getFacilityId())) {
                throw new IllegalArgumentException("Nhân viên ID [" + empId + "] không thuộc cơ sở này! Không thể phân công.");
            }
        }

        // Xóa / Ghi đè danh sách phân công cũ của ca này
        staffShiftRepository.deleteByFacilityIdAndShiftIdAndWorkDate(facilityId, shiftId, date);

        // Thêm danh sách mới
        for (Integer empId : employeeIds) {
            StaffShift newShift = new StaffShift(empId, facilityId, shiftId, date, "SCHEDULED");
            staffShiftRepository.save(newShift);
        }

        // Trả về lịch cả ngày sau khi lưu
        return getShiftSchedule(facilityId, date);
    }
}
