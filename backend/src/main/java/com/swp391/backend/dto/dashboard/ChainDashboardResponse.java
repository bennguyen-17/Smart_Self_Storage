package com.swp391.backend.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;

public class ChainDashboardResponse {
    private int chainTotalFacilities;
    private long chainTotalUnits;
    private double chainAverageOccupancyRate;
    private long chainTotalActiveContracts;
    private BigDecimal chainTotalRevenue = BigDecimal.ZERO;
    private BigDecimal chainTotalRefunds = BigDecimal.ZERO;
    private BigDecimal chainNetRevenue = BigDecimal.ZERO;
    private BigDecimal chainDepositHolding = BigDecimal.ZERO;

    private List<ManagerDashboardResponse> facilityBreakdown;

    public ChainDashboardResponse() {
    }

    public int getChainTotalFacilities() {
        return chainTotalFacilities;
    }

    public void setChainTotalFacilities(int chainTotalFacilities) {
        this.chainTotalFacilities = chainTotalFacilities;
    }

    public long getChainTotalUnits() {
        return chainTotalUnits;
    }

    public void setChainTotalUnits(long chainTotalUnits) {
        this.chainTotalUnits = chainTotalUnits;
    }

    public double getChainAverageOccupancyRate() {
        return chainAverageOccupancyRate;
    }

    public void setChainAverageOccupancyRate(double chainAverageOccupancyRate) {
        this.chainAverageOccupancyRate = chainAverageOccupancyRate;
    }

    public long getChainTotalActiveContracts() {
        return chainTotalActiveContracts;
    }

    public void setChainTotalActiveContracts(long chainTotalActiveContracts) {
        this.chainTotalActiveContracts = chainTotalActiveContracts;
    }

    public BigDecimal getChainTotalRevenue() {
        return chainTotalRevenue;
    }

    public void setChainTotalRevenue(BigDecimal chainTotalRevenue) {
        this.chainTotalRevenue = chainTotalRevenue;
    }

    public BigDecimal getChainTotalRefunds() {
        return chainTotalRefunds;
    }

    public void setChainTotalRefunds(BigDecimal chainTotalRefunds) {
        this.chainTotalRefunds = chainTotalRefunds;
    }

    public BigDecimal getChainNetRevenue() {
        return chainNetRevenue;
    }

    public void setChainNetRevenue(BigDecimal chainNetRevenue) {
        this.chainNetRevenue = chainNetRevenue;
    }

    public BigDecimal getChainDepositHolding() {
        return chainDepositHolding;
    }

    public void setChainDepositHolding(BigDecimal chainDepositHolding) {
        this.chainDepositHolding = chainDepositHolding;
    }

    public List<ManagerDashboardResponse> getFacilityBreakdown() {
        return facilityBreakdown;
    }

    public void setFacilityBreakdown(List<ManagerDashboardResponse> facilityBreakdown) {
        this.facilityBreakdown = facilityBreakdown;
    }
}
