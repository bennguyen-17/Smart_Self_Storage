package com.swp391.backend.dto;

import java.util.List;

public class ForfeitProcessedRequest {
    private String note;
    private List<Integer> evidenceImageIds;

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public List<Integer> getEvidenceImageIds() {
        return evidenceImageIds;
    }

    public void setEvidenceImageIds(List<Integer> evidenceImageIds) {
        this.evidenceImageIds = evidenceImageIds;
    }
}
