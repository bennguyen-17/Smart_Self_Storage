package com.swp391.backend.dto.ticket;

import java.time.LocalDate;

public class CreateEarlyTerminationRequest {
    private Integer contractId;
    private LocalDate desiredDate;
    private String otpCode;
    private String reason;

    public CreateEarlyTerminationRequest() {
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public LocalDate getDesiredDate() {
        return desiredDate;
    }

    public void setDesiredDate(LocalDate desiredDate) {
        this.desiredDate = desiredDate;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
