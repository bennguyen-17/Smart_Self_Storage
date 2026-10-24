package com.swp391.backend.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ManagerStaffActivityResponse {
    private LocalDate date;
    private List<ShiftActivity> shifts = new ArrayList<>();

    public ManagerStaffActivityResponse() {}

    public ManagerStaffActivityResponse(LocalDate date, List<ShiftActivity> shifts) {
        this.date = date;
        this.shifts = shifts;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public List<ShiftActivity> getShifts() { return shifts; }
    public void setShifts(List<ShiftActivity> shifts) { this.shifts = shifts; }

    public static class ShiftActivity {
        private Integer shiftId;
        private String shiftName;
        private String startTime;
        private String endTime;
        private List<StaffActivity> staff = new ArrayList<>();

        public ShiftActivity() {}

        public ShiftActivity(Integer shiftId, String shiftName, String startTime, String endTime,
                             List<StaffActivity> staff) {
            this.shiftId = shiftId;
            this.shiftName = shiftName;
            this.startTime = startTime;
            this.endTime = endTime;
            this.staff = staff;
        }

        public Integer getShiftId() { return shiftId; }
        public void setShiftId(Integer shiftId) { this.shiftId = shiftId; }
        public String getShiftName() { return shiftName; }
        public void setShiftName(String shiftName) { this.shiftName = shiftName; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public List<StaffActivity> getStaff() { return staff; }
        public void setStaff(List<StaffActivity> staff) { this.staff = staff; }
    }

    public static class StaffActivity {
        private Integer employeeId;
        private Integer accountId;
        private String fullName;
        private boolean attended;
        private long checkIns;
        private long checkouts;
        private long ticketsResolved;
        private long maintenanceDone;
        private long tasksDone;
        private Double avgTicketAcceptMinutes;

        public StaffActivity() {}

        public Integer getEmployeeId() { return employeeId; }
        public void setEmployeeId(Integer employeeId) { this.employeeId = employeeId; }
        public Integer getAccountId() { return accountId; }
        public void setAccountId(Integer accountId) { this.accountId = accountId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public boolean isAttended() { return attended; }
        public void setAttended(boolean attended) { this.attended = attended; }
        public long getCheckIns() { return checkIns; }
        public void setCheckIns(long checkIns) { this.checkIns = checkIns; }
        public long getCheckouts() { return checkouts; }
        public void setCheckouts(long checkouts) { this.checkouts = checkouts; }
        public long getTicketsResolved() { return ticketsResolved; }
        public void setTicketsResolved(long ticketsResolved) { this.ticketsResolved = ticketsResolved; }
        public long getMaintenanceDone() { return maintenanceDone; }
        public void setMaintenanceDone(long maintenanceDone) { this.maintenanceDone = maintenanceDone; }
        public long getTasksDone() { return tasksDone; }
        public void setTasksDone(long tasksDone) { this.tasksDone = tasksDone; }
        public Double getAvgTicketAcceptMinutes() { return avgTicketAcceptMinutes; }
        public void setAvgTicketAcceptMinutes(Double avgTicketAcceptMinutes) { this.avgTicketAcceptMinutes = avgTicketAcceptMinutes; }
    }
}
