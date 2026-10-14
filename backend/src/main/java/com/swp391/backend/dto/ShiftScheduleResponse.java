package com.swp391.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class ShiftScheduleResponse {
    private String date;
    private List<ShiftDetailDto> shifts = new ArrayList<>();

    public ShiftScheduleResponse() {
    }

    public ShiftScheduleResponse(String date, List<ShiftDetailDto> shifts) {
        this.date = date;
        this.shifts = shifts;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public List<ShiftDetailDto> getShifts() {
        return shifts;
    }

    public void setShifts(List<ShiftDetailDto> shifts) {
        this.shifts = shifts;
    }

    public static class ShiftDetailDto {
        private Integer shiftId;
        private String shiftName;
        private String startTime;
        private String endTime;
        private List<StaffMemberDto> staff = new ArrayList<>();

        public ShiftDetailDto() {
        }

        public ShiftDetailDto(Integer shiftId, String shiftName, String startTime, String endTime, List<StaffMemberDto> staff) {
            this.shiftId = shiftId;
            this.shiftName = shiftName;
            this.startTime = startTime;
            this.endTime = endTime;
            this.staff = staff != null ? staff : new ArrayList<>();
        }

        public Integer getShiftId() {
            return shiftId;
        }

        public void setShiftId(Integer shiftId) {
            this.shiftId = shiftId;
        }

        public String getShiftName() {
            return shiftName;
        }

        public void setShiftName(String shiftName) {
            this.shiftName = shiftName;
        }

        public String getStartTime() {
            return startTime;
        }

        public void setStartTime(String startTime) {
            this.startTime = startTime;
        }

        public String getEndTime() {
            return endTime;
        }

        public void setEndTime(String endTime) {
            this.endTime = endTime;
        }

        public List<StaffMemberDto> getStaff() {
            return staff;
        }

        public void setStaff(List<StaffMemberDto> staff) {
            this.staff = staff;
        }
    }

    public static class StaffMemberDto {
        private Integer employeeId;
        private String fullName;

        public StaffMemberDto() {
        }

        public StaffMemberDto(Integer employeeId, String fullName) {
            this.employeeId = employeeId;
            this.fullName = fullName;
        }

        public Integer getEmployeeId() {
            return employeeId;
        }

        public void setEmployeeId(Integer employeeId) {
            this.employeeId = employeeId;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }
    }
}
