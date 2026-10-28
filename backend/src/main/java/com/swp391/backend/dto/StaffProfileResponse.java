package com.swp391.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class StaffProfileResponse {
    private boolean success;
    private Integer accountId;
    private Integer employeeId;
    private String fullName;
    private String phone;
    private String email;
    private String role;
    private String roleTitle;
    private String staffCode;
    private Integer facilityId;
    private String facilityCode;
    private String facilityName;
    private String facilityAddress;
    private String date;
    private String shiftStatus; // IN_SHIFT, UPCOMING, ENDED, NO_SHIFT
    private String shiftStatusText;
    private List<AssignedShiftDto> assignedShifts = new ArrayList<>();

    public StaffProfileResponse() {
    }

    public static class AssignedShiftDto {
        private Integer shiftId;
        private String shiftName;
        private String startTime;
        private String endTime;
        private boolean isCurrent;
        private String status;

        public AssignedShiftDto() {
        }

        public AssignedShiftDto(Integer shiftId, String shiftName, String startTime, String endTime, boolean isCurrent, String status) {
            this.shiftId = shiftId;
            this.shiftName = shiftName;
            this.startTime = startTime;
            this.endTime = endTime;
            this.isCurrent = isCurrent;
            this.status = status;
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

        @com.fasterxml.jackson.annotation.JsonProperty("isCurrent")
        public boolean isCurrent() {
            return isCurrent;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("isCurrent")
        public void setCurrent(boolean current) {
            isCurrent = current;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public String getStaffCode() {
        return staffCode;
    }

    public void setStaffCode(String staffCode) {
        this.staffCode = staffCode;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public String getFacilityCode() {
        return facilityCode;
    }

    public void setFacilityCode(String facilityCode) {
        this.facilityCode = facilityCode;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public String getFacilityAddress() {
        return facilityAddress;
    }

    public void setFacilityAddress(String facilityAddress) {
        this.facilityAddress = facilityAddress;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getShiftStatus() {
        return shiftStatus;
    }

    public void setShiftStatus(String shiftStatus) {
        this.shiftStatus = shiftStatus;
    }

    public String getShiftStatusText() {
        return shiftStatusText;
    }

    public void setShiftStatusText(String shiftStatusText) {
        this.shiftStatusText = shiftStatusText;
    }

    public List<AssignedShiftDto> getAssignedShifts() {
        return assignedShifts;
    }

    public void setAssignedShifts(List<AssignedShiftDto> assignedShifts) {
        this.assignedShifts = assignedShifts;
    }
}
