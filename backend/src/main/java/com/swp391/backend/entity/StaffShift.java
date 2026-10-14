package com.swp391.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "StaffShift")
public class StaffShift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staffShiftId")
    private Integer staffShiftId;

    @Column(name = "employeeId", nullable = false)
    private Integer employeeId;

    @Column(name = "facilityId", nullable = false)
    private Integer facilityId;

    @Column(name = "shiftId", nullable = false)
    private Integer shiftId;

    @Column(name = "workDate", nullable = false)
    private LocalDate workDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "SCHEDULED"; // SCHEDULED, ATTENDED, ABSENT, CANCELLED

    public StaffShift() {
    }

    public StaffShift(Integer employeeId, Integer facilityId, Integer shiftId, LocalDate workDate, String status) {
        this.employeeId = employeeId;
        this.facilityId = facilityId;
        this.shiftId = shiftId;
        this.workDate = workDate;
        this.status = status;
    }

    public Integer getStaffShiftId() {
        return staffShiftId;
    }

    public void setStaffShiftId(Integer staffShiftId) {
        this.staffShiftId = staffShiftId;
    }

    public Integer getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Integer employeeId) {
        this.employeeId = employeeId;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public Integer getShiftId() {
        return shiftId;
    }

    public void setShiftId(Integer shiftId) {
        this.shiftId = shiftId;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
