package com.swp391.backend.dto.checkout;

import java.math.BigDecimal;

public class CheckoutConfirmResponse {
    private boolean success;
    private String message;
    private Integer contractId;
    private String contractStatus;
    private String unitCode;
    private String unitStatus;
    private boolean gatePinDisabled;
    private String invoiceNumber;
    private String invoiceType;
    private BigDecimal settlementAmount;
    private boolean isRefund;
    private boolean ticketResolved;

    public CheckoutConfirmResponse() {
    }

    public static CheckoutConfirmResponse error(String message) {
        CheckoutConfirmResponse resp = new CheckoutConfirmResponse();
        resp.setSuccess(false);
        resp.setMessage(message);
        return resp;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public String getContractStatus() {
        return contractStatus;
    }

    public void setContractStatus(String contractStatus) {
        this.contractStatus = contractStatus;
    }

    public String getUnitCode() {
        return unitCode;
    }

    public void setUnitCode(String unitCode) {
        this.unitCode = unitCode;
    }

    public String getUnitStatus() {
        return unitStatus;
    }

    public void setUnitStatus(String unitStatus) {
        this.unitStatus = unitStatus;
    }

    public boolean isGatePinDisabled() {
        return gatePinDisabled;
    }

    public void setGatePinDisabled(boolean gatePinDisabled) {
        this.gatePinDisabled = gatePinDisabled;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getInvoiceType() {
        return invoiceType;
    }

    public void setInvoiceType(String invoiceType) {
        this.invoiceType = invoiceType;
    }

    public BigDecimal getSettlementAmount() {
        return settlementAmount;
    }

    public void setSettlementAmount(BigDecimal settlementAmount) {
        this.settlementAmount = settlementAmount;
    }

    public boolean isRefund() {
        return isRefund;
    }

    public void setRefund(boolean refund) {
        isRefund = refund;
    }

    public boolean isTicketResolved() {
        return ticketResolved;
    }

    public void setTicketResolved(boolean ticketResolved) {
        this.ticketResolved = ticketResolved;
    }
}
