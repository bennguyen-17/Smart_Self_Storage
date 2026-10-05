package com.swp391.backend.dto.ticket;

public class ResolveUnlockRequest {
    private Boolean identityVerified;
    private String note;

    public ResolveUnlockRequest() {
    }

    public Boolean getIdentityVerified() {
        return identityVerified;
    }

    public void setIdentityVerified(Boolean identityVerified) {
        this.identityVerified = identityVerified;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
