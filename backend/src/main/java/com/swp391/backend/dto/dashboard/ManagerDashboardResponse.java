package com.swp391.backend.dto.dashboard;

import java.math.BigDecimal;

public class ManagerDashboardResponse {
    private Integer facilityId;
    private String facilityName;
    private String facilityCode;

    // 1. Thống kê Ô kho & Tỷ lệ lấp đầy
    private long totalUnits;
    private long availableUnits;
    private long occupiedUnits;
    private long reservedUnits;
    private long maintenanceUnits;
    private double occupancyRate; // % lấp đầy

    // 2. Thống kê Hợp đồng
    private long activeContracts;
    private long pendingCheckinContracts;
    private long overdueContracts;
    private long terminatedContracts;

    // 3. Thống kê Doanh thu theo công thức chuẩn BR-51
    private BigDecimal rentalRevenue = BigDecimal.ZERO;
    private BigDecimal extensionRevenue = BigDecimal.ZERO;
    private BigDecimal penaltyRevenue = BigDecimal.ZERO;
    private BigDecimal compensationRevenue = BigDecimal.ZERO;
    private BigDecimal totalRefunds = BigDecimal.ZERO;
    private BigDecimal netRevenue = BigDecimal.ZERO; // (Rental + Ext + Penalty + CMP) - TotalRefunds

    // Các dòng báo cáo riêng theo quy định BR-51
    private BigDecimal depositHolding = BigDecimal.ZERO; // Tiền cọc đang bảo lưu
    private BigDecimal forfeitedDeposit = BigDecimal.ZERO; // Tiền cọc tịch thu (No-Show)
    private BigDecimal waivedAmount = BigDecimal.ZERO; // Tiền phí được miễn/giảm theo BR-48

    // 4. Thống kê Support Ticket & SLA
    private long totalTickets;
    private long submittedTickets;
    private long inProgressTickets;
    private long resolvedTickets;
    private long slaBreachedTickets;

    public ManagerDashboardResponse() {
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public String getFacilityCode() {
        return facilityCode;
    }

    public void setFacilityCode(String facilityCode) {
        this.facilityCode = facilityCode;
    }

    public long getTotalUnits() {
        return totalUnits;
    }

    public void setTotalUnits(long totalUnits) {
        this.totalUnits = totalUnits;
    }

    public long getAvailableUnits() {
        return availableUnits;
    }

    public void setAvailableUnits(long availableUnits) {
        this.availableUnits = availableUnits;
    }

    public long getOccupiedUnits() {
        return occupiedUnits;
    }

    public void setOccupiedUnits(long occupiedUnits) {
        this.occupiedUnits = occupiedUnits;
    }

    public long getReservedUnits() {
        return reservedUnits;
    }

    public void setReservedUnits(long reservedUnits) {
        this.reservedUnits = reservedUnits;
    }

    public long getMaintenanceUnits() {
        return maintenanceUnits;
    }

    public void setMaintenanceUnits(long maintenanceUnits) {
        this.maintenanceUnits = maintenanceUnits;
    }

    public double getOccupancyRate() {
        return occupancyRate;
    }

    public void setOccupancyRate(double occupancyRate) {
        this.occupancyRate = occupancyRate;
    }

    public long getActiveContracts() {
        return activeContracts;
    }

    public void setActiveContracts(long activeContracts) {
        this.activeContracts = activeContracts;
    }

    public long getPendingCheckinContracts() {
        return pendingCheckinContracts;
    }

    public void setPendingCheckinContracts(long pendingCheckinContracts) {
        this.pendingCheckinContracts = pendingCheckinContracts;
    }

    public long getOverdueContracts() {
        return overdueContracts;
    }

    public void setOverdueContracts(long overdueContracts) {
        this.overdueContracts = overdueContracts;
    }

    public long getTerminatedContracts() {
        return terminatedContracts;
    }

    public void setTerminatedContracts(long terminatedContracts) {
        this.terminatedContracts = terminatedContracts;
    }

    public BigDecimal getRentalRevenue() {
        return rentalRevenue;
    }

    public void setRentalRevenue(BigDecimal rentalRevenue) {
        this.rentalRevenue = rentalRevenue;
    }

    public BigDecimal getExtensionRevenue() {
        return extensionRevenue;
    }

    public void setExtensionRevenue(BigDecimal extensionRevenue) {
        this.extensionRevenue = extensionRevenue;
    }

    public BigDecimal getPenaltyRevenue() {
        return penaltyRevenue;
    }

    public void setPenaltyRevenue(BigDecimal penaltyRevenue) {
        this.penaltyRevenue = penaltyRevenue;
    }

    public BigDecimal getCompensationRevenue() {
        return compensationRevenue;
    }

    public void setCompensationRevenue(BigDecimal compensationRevenue) {
        this.compensationRevenue = compensationRevenue;
    }

    public BigDecimal getTotalRefunds() {
        return totalRefunds;
    }

    public void setTotalRefunds(BigDecimal totalRefunds) {
        this.totalRefunds = totalRefunds;
    }

    public BigDecimal getNetRevenue() {
        return netRevenue;
    }

    public void setNetRevenue(BigDecimal netRevenue) {
        this.netRevenue = netRevenue;
    }

    public BigDecimal getDepositHolding() {
        return depositHolding;
    }

    public void setDepositHolding(BigDecimal depositHolding) {
        this.depositHolding = depositHolding;
    }

    public BigDecimal getForfeitedDeposit() {
        return forfeitedDeposit;
    }

    public void setForfeitedDeposit(BigDecimal forfeitedDeposit) {
        this.forfeitedDeposit = forfeitedDeposit;
    }

    public BigDecimal getWaivedAmount() {
        return waivedAmount;
    }

    public void setWaivedAmount(BigDecimal waivedAmount) {
        this.waivedAmount = waivedAmount;
    }

    public long getTotalTickets() {
        return totalTickets;
    }

    public void setTotalTickets(long totalTickets) {
        this.totalTickets = totalTickets;
    }

    public long getSubmittedTickets() {
        return submittedTickets;
    }

    public void setSubmittedTickets(long submittedTickets) {
        this.submittedTickets = submittedTickets;
    }

    public long getInProgressTickets() {
        return inProgressTickets;
    }

    public void setInProgressTickets(long inProgressTickets) {
        this.inProgressTickets = inProgressTickets;
    }

    public long getResolvedTickets() {
        return resolvedTickets;
    }

    public void setResolvedTickets(long resolvedTickets) {
        this.resolvedTickets = resolvedTickets;
    }

    public long getSlaBreachedTickets() {
        return slaBreachedTickets;
    }

    public void setSlaBreachedTickets(long slaBreachedTickets) {
        this.slaBreachedTickets = slaBreachedTickets;
    }
}
