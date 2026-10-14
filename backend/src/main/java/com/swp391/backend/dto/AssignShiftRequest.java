package com.swp391.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class AssignShiftRequest {
    private List<Integer> employeeIds = new ArrayList<>();

    public AssignShiftRequest() {
    }

    public AssignShiftRequest(List<Integer> employeeIds) {
        this.employeeIds = employeeIds;
    }

    public List<Integer> getEmployeeIds() {
        return employeeIds;
    }

    public void setEmployeeIds(List<Integer> employeeIds) {
        this.employeeIds = employeeIds;
    }
}
