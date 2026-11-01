package com.swp391.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class FacilityContractResponse {
    private Integer contractId;
    private String contractCode;
    private String customerName;
    private String customerPhone;
    private String unitCode;
    private String startDate;
    private String endDate;
    private String status;
    private boolean forfeitProcessed;
    private Double depositAmount;
    private String checkoutStage;
    private List<FeeInvoiceResponse> fees = new ArrayList<>();
    private Double rentalAmount;
    private String rentalType;
    private String reservationCode;

    public FacilityContractResponse() {
    }

    public FacilityContractResponse(Integer contractId, String contractCode, String customerName, String customerPhone,
                                    String unitCode, String startDate, String endDate, String status,
                                    Double depositAmount, String checkoutStage, List<FeeInvoiceResponse> fees) {
        this.contractId = contractId;
        this.contractCode = contractCode;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.unitCode = unitCode;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.depositAmount = depositAmount;
        this.checkoutStage = checkoutStage;
        this.fees = (fees != null) ? fees : new ArrayList<>();
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public String getContractCode() {
        return contractCode;
    }

    public void setContractCode(String contractCode) {
        this.contractCode = contractCode;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getUnitCode() {
        return unitCode;
    }

    public void setUnitCode(String unitCode) {
        this.unitCode = unitCode;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isForfeitProcessed() {
        return forfeitProcessed;
    }

    public void setForfeitProcessed(boolean forfeitProcessed) {
        this.forfeitProcessed = forfeitProcessed;
    }

    public Double getDepositAmount() {
        return depositAmount;
    }

    public void setDepositAmount(Double depositAmount) {
        this.depositAmount = depositAmount;
    }

    public String getCheckoutStage() {
        return checkoutStage;
    }

    public void setCheckoutStage(String checkoutStage) {
        this.checkoutStage = checkoutStage;
    }

    public List<FeeInvoiceResponse> getFees() {
        return fees;
    }

    public void setFees(List<FeeInvoiceResponse> fees) {
        this.fees = fees;
    }

    public Double getRentalAmount() {
        return rentalAmount;
    }

    public void setRentalAmount(Double rentalAmount) {
        this.rentalAmount = rentalAmount;
    }

    public String getRentalType() {
        return rentalType;
    }

    public void setRentalType(String rentalType) {
        this.rentalType = rentalType;
    }

    public String getReservationCode() {
        return reservationCode;
    }

    public void setReservationCode(String reservationCode) {
        this.reservationCode = reservationCode;
    }

    public static class FeeInvoiceResponse {
        private Integer paymentId;
        private String invoiceNumber;
        private String type; // PEN or CMP
        private Double amount;
        private String status; // UNPAID, PAID, CANCELLED
        private String issuedAt;

        public FeeInvoiceResponse() {
        }

        public FeeInvoiceResponse(Integer paymentId, String invoiceNumber, String type, Double amount, String status, String issuedAt) {
            this.paymentId = paymentId;
            this.invoiceNumber = invoiceNumber;
            this.type = type;
            this.amount = amount;
            this.status = status;
            this.issuedAt = issuedAt;
        }

        public Integer getPaymentId() {
            return paymentId;
        }

        public void setPaymentId(Integer paymentId) {
            this.paymentId = paymentId;
        }

        public String getInvoiceNumber() {
            return invoiceNumber;
        }

        public void setInvoiceNumber(String invoiceNumber) {
            this.invoiceNumber = invoiceNumber;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getIssuedAt() {
            return issuedAt;
        }

        public void setIssuedAt(String issuedAt) {
            this.issuedAt = issuedAt;
        }
    }
}
