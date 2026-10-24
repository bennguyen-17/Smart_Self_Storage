package com.swp391.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "StaffTask")
public class StaffTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "taskId")
    private Integer taskId;

    @Column(name = "facilityId", nullable = false)
    private Integer facilityId;

    @Column(name = "assignedEmployeeId", nullable = false)
    private Integer assignedEmployeeId;

    @Column(name = "assignedByAccountId", nullable = false)
    private Integer assignedByAccountId;

    @Column(name = "taskType", nullable = false, length = 30)
    private String taskType;

    @Column(name = "unitCode", length = 50)
    private String unitCode;

    @Column(name = "contractId")
    private Integer contractId;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, length = 20)
    private String status = "ASSIGNED";

    @Column(name = "workDate", nullable = false)
    private LocalDate workDate;

    @Column(name = "shiftId", nullable = false)
    private Integer shiftId;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "doneAt")
    private LocalDateTime doneAt;

    public Integer getTaskId() { return taskId; }
    public void setTaskId(Integer taskId) { this.taskId = taskId; }
    public Integer getFacilityId() { return facilityId; }
    public void setFacilityId(Integer facilityId) { this.facilityId = facilityId; }
    public Integer getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(Integer assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }
    public Integer getAssignedByAccountId() { return assignedByAccountId; }
    public void setAssignedByAccountId(Integer assignedByAccountId) { this.assignedByAccountId = assignedByAccountId; }
    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }
    public String getUnitCode() { return unitCode; }
    public void setUnitCode(String unitCode) { this.unitCode = unitCode; }
    public Integer getContractId() { return contractId; }
    public void setContractId(Integer contractId) { this.contractId = contractId; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }
    public Integer getShiftId() { return shiftId; }
    public void setShiftId(Integer shiftId) { this.shiftId = shiftId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getDoneAt() { return doneAt; }
    public void setDoneAt(LocalDateTime doneAt) { this.doneAt = doneAt; }
}
