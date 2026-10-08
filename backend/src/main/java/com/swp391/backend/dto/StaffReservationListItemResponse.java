package com.swp391.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class StaffReservationListItemResponse {
    private Integer reservationId;
    private String reservationCode;
    private String customerName;
    private String customerPhone;
    private String unitCode;
    private String floorName;
    private String reservationStatus;
    private LocalDate checkInDate;
    private String contractStatus;
    private String depStatus;
    private String depPaymentStatus;
    private BigDecimal depAmount;
    private BigDecimal depPaidAmount;
    private BigDecimal depRemainingAmount;

    public StaffReservationListItemResponse() {}

    public Integer getReservationId() { return reservationId; }
    public void setReservationId(Integer reservationId) { this.reservationId = reservationId; }
    public String getReservationCode() { return reservationCode; }
    public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getUnitCode() { return unitCode; }
    public void setUnitCode(String unitCode) { this.unitCode = unitCode; }
    public String getFloorName() { return floorName; }
    public void setFloorName(String floorName) { this.floorName = floorName; }
    public String getReservationStatus() { return reservationStatus; }
    public void setReservationStatus(String reservationStatus) { this.reservationStatus = reservationStatus; }
    public LocalDate getCheckInDate() { return checkInDate; }
    public void setCheckInDate(LocalDate checkInDate) { this.checkInDate = checkInDate; }
    public String getContractStatus() { return contractStatus; }
    public void setContractStatus(String contractStatus) { this.contractStatus = contractStatus; }
    public String getDepStatus() { return depStatus; }
    public void setDepStatus(String depStatus) { this.depStatus = depStatus; }
    public String getDepPaymentStatus() { return depPaymentStatus; }
    public void setDepPaymentStatus(String depPaymentStatus) { this.depPaymentStatus = depPaymentStatus; }
    public BigDecimal getDepAmount() { return depAmount; }
    public void setDepAmount(BigDecimal depAmount) { this.depAmount = depAmount; }
    public BigDecimal getDepPaidAmount() { return depPaidAmount; }
    public void setDepPaidAmount(BigDecimal depPaidAmount) { this.depPaidAmount = depPaidAmount; }
    public BigDecimal getDepRemainingAmount() { return depRemainingAmount; }
    public void setDepRemainingAmount(BigDecimal depRemainingAmount) { this.depRemainingAmount = depRemainingAmount; }
}
