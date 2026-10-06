package com.swp391.backend.service;

import com.swp391.backend.dto.dashboard.ChainDashboardResponse;
import com.swp391.backend.dto.dashboard.ManagerDashboardResponse;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final FacilityRepository facilityRepository;
    private final FloorRepository floorRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final PaymentRepository paymentRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final StorageService storageService;

    public DashboardService(FacilityRepository facilityRepository,
                            FloorRepository floorRepository,
                            StorageUnitRepository storageUnitRepository,
                            ContractRepository contractRepository,
                            ReservationRepository reservationRepository,
                            PaymentRepository paymentRepository,
                            SupportTicketRepository supportTicketRepository,
                            StorageService storageService) {
        this.facilityRepository = facilityRepository;
        this.floorRepository = floorRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.storageService = storageService;
    }

    /**
     * US-33: Dashboard & Báo cáo cơ sở cho Facility Manager (BR-06, BR-37, BR-45, BR-51)
     */
    public ManagerDashboardResponse getManagerDashboard(Integer facilityId) {
        Optional<Facility> facOpt = facilityRepository.findById(facilityId);
        if (facOpt.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy cơ sở #" + facilityId);
        }

        Facility fac = facOpt.get();
        String facilityCode = storageService.mapFacilityToResponse(fac).getFacilityCode();

        // 1. Thống kê ô kho thuộc cơ sở này (thông qua Floor)
        List<Floor> floors = floorRepository.findByFacilityId(facilityId);
        List<Integer> floorIds = floors.stream().map(Floor::getFloorId).collect(Collectors.toList());

        List<StorageUnit> allUnits = storageUnitRepository.findAll().stream()
                .filter(u -> floorIds.contains(u.getFloorId()))
                .collect(Collectors.toList());

        long totalUnits = allUnits.size();
        long availableUnits = allUnits.stream().filter(u -> "AVAILABLE".equalsIgnoreCase(u.getStatus())).count();
        long occupiedUnits = allUnits.stream().filter(u -> "OCCUPIED".equalsIgnoreCase(u.getStatus())).count();
        long reservedUnits = allUnits.stream().filter(u -> "RESERVED".equalsIgnoreCase(u.getStatus()) || "HOLD".equalsIgnoreCase(u.getStatus())).count();
        long maintenanceUnits = allUnits.stream().filter(u -> "UNDER_MAINTENANCE".equalsIgnoreCase(u.getStatus())).count();

        double occupancyRate = totalUnits > 0 ? ((double) occupiedUnits / totalUnits) * 100.0 : 0.0;

        // 2. Thống kê Hợp đồng thuộc cơ sở này
        Set<String> unitCodes = allUnits.stream().map(StorageUnit::getUnitCode).collect(Collectors.toSet());
        List<Reservation> reservations = reservationRepository.findAll().stream()
                .filter(r -> unitCodes.contains(r.getUnitCode()))
                .collect(Collectors.toList());

        Set<Integer> resIds = reservations.stream().map(Reservation::getReservationId).collect(Collectors.toSet());
        List<Contract> contracts = contractRepository.findAll().stream()
                .filter(c -> resIds.contains(c.getReservationId()))
                .collect(Collectors.toList());

        long activeContracts = contracts.stream().filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus())).count();
        long pendingCheckin = contracts.stream().filter(c -> "PENDING_CHECKIN".equalsIgnoreCase(c.getStatus())).count();
        long overdueContracts = contracts.stream().filter(c -> "OVERDUE".equalsIgnoreCase(c.getStatus())).count();
        long terminatedContracts = contracts.stream().filter(c -> "TERMINATED".equalsIgnoreCase(c.getStatus())).count();

        // 3. Thống kê Tài chính Doanh thu theo chuẩn BR-51
        Set<Integer> contractIds = contracts.stream().map(Contract::getContractId).collect(Collectors.toSet());
        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(p -> contractIds.contains(p.getContractId()))
                .collect(Collectors.toList());

        BigDecimal rentalRevenue = BigDecimal.ZERO;
        BigDecimal extensionRevenue = BigDecimal.ZERO;
        BigDecimal penaltyRevenue = BigDecimal.ZERO;
        BigDecimal compensationRevenue = BigDecimal.ZERO;
        BigDecimal totalRefunds = BigDecimal.ZERO;
        BigDecimal depositHolding = BigDecimal.ZERO;
        BigDecimal forfeitedDeposit = BigDecimal.ZERO;

        for (Payment p : payments) {
            String invNum = p.getInvoiceNumber() != null ? p.getInvoiceNumber() : "";
            boolean isPaid = "PAID".equalsIgnoreCase(p.getStatus()) || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus());

            if (invNum.startsWith("REF-") && isPaid) {
                totalRefunds = totalRefunds.add(p.getAmount());
            } else if (invNum.startsWith("CMP-") && isPaid) {
                compensationRevenue = compensationRevenue.add(p.getAmount());
            } else if ("OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) && isPaid) {
                penaltyRevenue = penaltyRevenue.add(p.getAmount());
            } else if ("MONTHLY_RENEWAL".equalsIgnoreCase(p.getInvoiceType()) && isPaid) {
                extensionRevenue = extensionRevenue.add(p.getAmount());
            } else if ("INITIAL_RENTAL".equalsIgnoreCase(p.getInvoiceType()) && isPaid) {
                rentalRevenue = rentalRevenue.add(p.getAmount());
            }
        }

        for (Reservation r : reservations) {
            Optional<Contract> cOpt = contracts.stream().filter(c -> c.getReservationId().equals(r.getReservationId())).findFirst();
            if (cOpt.isPresent()) {
                String cStatus = cOpt.get().getStatus();
                if ("ACTIVE".equalsIgnoreCase(cStatus) || "PENDING_CHECKIN".equalsIgnoreCase(cStatus)) {
                    if (r.getDepositAmount() != null) {
                        depositHolding = depositHolding.add(r.getDepositAmount());
                    }
                } else if ("CANCELED".equalsIgnoreCase(cStatus) || "FORFEITED".equalsIgnoreCase(cStatus)) {
                    if (r.getDepositAmount() != null) {
                        forfeitedDeposit = forfeitedDeposit.add(r.getDepositAmount());
                    }
                }
            }
        }

        BigDecimal grossRevenue = rentalRevenue.add(extensionRevenue).add(penaltyRevenue).add(compensationRevenue);
        BigDecimal netRevenue = grossRevenue.subtract(totalRefunds);

        // 4. Thống kê Support Ticket & SLA
        List<SupportTicket> tickets = supportTicketRepository.findByFacilityIdOrderByCreatedAtDesc(facilityId);
        long totalTickets = tickets.size();
        long submittedTickets = tickets.stream().filter(t -> "SUBMITTED".equalsIgnoreCase(t.getStatus())).count();
        long inProgressTickets = tickets.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus())).count();
        long resolvedTickets = tickets.stream().filter(t -> "RESOLVED".equalsIgnoreCase(t.getStatus())).count();

        LocalDateTime now = LocalDateTime.now();
        long slaBreachedTickets = tickets.stream().filter(t -> {
            if ("INCIDENT".equalsIgnoreCase(t.getType()) && !"RESOLVED".equalsIgnoreCase(t.getStatus())) {
                return t.getSlaDeadline() != null && now.isAfter(t.getSlaDeadline());
            }
            return false;
        }).count();

        ManagerDashboardResponse resp = new ManagerDashboardResponse();
        resp.setFacilityId(facilityId);
        resp.setFacilityName(fac.getFacilityName());
        resp.setFacilityCode(facilityCode);

        resp.setTotalUnits(totalUnits);
        resp.setAvailableUnits(availableUnits);
        resp.setOccupiedUnits(occupiedUnits);
        resp.setReservedUnits(reservedUnits);
        resp.setMaintenanceUnits(maintenanceUnits);
        resp.setOccupancyRate(Math.round(occupancyRate * 10.0) / 10.0);

        resp.setActiveContracts(activeContracts);
        resp.setPendingCheckinContracts(pendingCheckin);
        resp.setOverdueContracts(overdueContracts);
        resp.setTerminatedContracts(terminatedContracts);

        resp.setRentalRevenue(rentalRevenue);
        resp.setExtensionRevenue(extensionRevenue);
        resp.setPenaltyRevenue(penaltyRevenue);
        resp.setCompensationRevenue(compensationRevenue);
        resp.setTotalRefunds(totalRefunds);
        resp.setNetRevenue(netRevenue);

        resp.setDepositHolding(depositHolding);
        resp.setForfeitedDeposit(forfeitedDeposit);
        resp.setWaivedAmount(BigDecimal.ZERO);

        resp.setTotalTickets(totalTickets);
        resp.setSubmittedTickets(submittedTickets);
        resp.setInProgressTickets(inProgressTickets);
        resp.setResolvedTickets(resolvedTickets);
        resp.setSlaBreachedTickets(slaBreachedTickets);

        return resp;
    }

    /**
     * US-33: Báo cáo toàn chuỗi 7 cơ sở cho Ban Giám Đốc (BOM / Admin)
     */
    public ChainDashboardResponse getChainDashboard() {
        List<Facility> facilities = facilityRepository.findAll();
        List<ManagerDashboardResponse> breakdown = new ArrayList<>();

        long chainTotalUnits = 0;
        long chainOccupiedUnits = 0;
        long chainTotalActive = 0;
        BigDecimal chainGross = BigDecimal.ZERO;
        BigDecimal chainRefunds = BigDecimal.ZERO;
        BigDecimal chainNet = BigDecimal.ZERO;
        BigDecimal chainDeposit = BigDecimal.ZERO;

        for (Facility f : facilities) {
            try {
                ManagerDashboardResponse mResp = getManagerDashboard(f.getFacilityId());
                breakdown.add(mResp);

                chainTotalUnits += mResp.getTotalUnits();
                chainOccupiedUnits += mResp.getOccupiedUnits();
                chainTotalActive += mResp.getActiveContracts();
                chainGross = chainGross.add(mResp.getRentalRevenue().add(mResp.getExtensionRevenue()).add(mResp.getPenaltyRevenue()).add(mResp.getCompensationRevenue()));
                chainRefunds = chainRefunds.add(mResp.getTotalRefunds());
                chainNet = chainNet.add(mResp.getNetRevenue());
                chainDeposit = chainDeposit.add(mResp.getDepositHolding());
            } catch (Exception ignored) {}
        }

        double chainOccupancy = chainTotalUnits > 0 ? ((double) chainOccupiedUnits / chainTotalUnits) * 100.0 : 0.0;

        ChainDashboardResponse resp = new ChainDashboardResponse();
        resp.setChainTotalFacilities(facilities.size());
        resp.setChainTotalUnits(chainTotalUnits);
        resp.setChainAverageOccupancyRate(Math.round(chainOccupancy * 10.0) / 10.0);
        resp.setChainTotalActiveContracts(chainTotalActive);
        resp.setChainTotalRevenue(chainGross);
        resp.setChainTotalRefunds(chainRefunds);
        resp.setChainNetRevenue(chainNet);
        resp.setChainDepositHolding(chainDeposit);
        resp.setFacilityBreakdown(breakdown);

        return resp;
    }
}
