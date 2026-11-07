package com.swp391.backend.dto;

import java.util.List;

public class TerminateViolationRequest {
    private String reason;
    private List<Integer> evidenceImageIds;

    public TerminateViolationRequest() {}

    public TerminateViolationRequest(String reason, List<Integer> evidenceImageIds) {
        this.reason = reason;
        this.evidenceImageIds = evidenceImageIds;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public List<Integer> getEvidenceImageIds() {
        return evidenceImageIds;
    }

    public void setEvidenceImageIds(List<Integer> evidenceImageIds) {
        this.evidenceImageIds = evidenceImageIds;
    }
}
