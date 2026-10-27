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
    private final com.swp391.backend.repository.EmployeeProfileRepository employeeProfileRepository;
    private final com.swp391.backend.repository.AccountRepository accountRepository;

    public DashboardService(FacilityRepository facilityRepository,
                            FloorRepository floorRepository,
                            StorageUnitRepository storageUnitRepository,
                            ContractRepository contractRepository,
                            ReservationRepository reservationRepository,
                            PaymentRepository paymentRepository,
                            SupportTicketRepository supportTicketRepository,
                            StorageService storageService,
                            com.swp391.backend.repository.EmployeeProfileRepository employeeProfileRepository,
                            com.swp391.backend.repository.AccountRepository accountRepository) {
        this.facilityRepository = facilityRepository;
        this.floorRepository = floorRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.paymentRepository = paymentRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.storageService = storageService;
        this.employeeProfileRepository = employeeProfileRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * US-33: Dashboard & Báo cáo cơ sở cho Facility Manager
     */
    public ManagerDashboardResponse getManagerDashboard(Integer facilityId) {
        return getManagerDashboard(facilityId, null, null);
    }

    /**
     * B5 / US-33 / BR-51: Báo cáo lọc theo khoảng thời gian (from, to)
     * Doanh thu, hoàn tiền, miễn giảm, ticket tính trong khoảng; số ô, hợp đồng hiệu lực vẫn là snapshot hiện tại.
     */
    public ManagerDashboardResponse getManagerDashboard(Integer facilityId, String fromStr, String toStr) {
        LocalDateTime parsedFrom = null;
        LocalDateTime parsedTo = null;
        if (fromStr != null && !fromStr.isBlank()) {
            try {
                parsedFrom = java.time.LocalDate.parse(fromStr.trim()).atStartOfDay();
            } catch (Exception ignored) {}
        }
        if (toStr != null && !toStr.isBlank()) {
            try {
                parsedTo = java.time.LocalDate.parse(toStr.trim()).atTime(23, 59, 59);
            } catch (Exception ignored) {}
        }
        final LocalDateTime fromLdt = parsedFrom;
        final LocalDateTime toLdt = parsedTo;
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
        long occupiedUnits = allUnits.stream().filter(u -> "RENTED".equalsIgnoreCase(u.getStatus())).count();
        long reservedUnits = allUnits.stream().filter(u -> "RESERVED".equalsIgnoreCase(u.getStatus()) || "HOLD".equalsIgnoreCase(u.getStatus())).count();
        long maintenanceUnits = allUnits.stream().filter(u -> "MAINTENANCE".equalsIgnoreCase(u.getStatus())).count();

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
        long terminatedContracts = contracts.stream().filter(c -> "TERMINATED".equalsIgnoreCase(c.getStatus()) || "COMPLETED".equalsIgnoreCase(c.getStatus())).count();

        // 3. Thống kê Tài chính Doanh thu
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
        BigDecimal waivedAmount = BigDecimal.ZERO;

        // Xác định mốc thời gian: Tháng hiện tại & 3 tháng gần nhất
        java.time.YearMonth currentYm = java.time.YearMonth.now();
        java.time.YearMonth maxDataYm = payments.stream()
                .map(p -> p.getPaidAt() != null ? p.getPaidAt() : p.getIssuedAt())
                .filter(Objects::nonNull)
                .map(java.time.YearMonth::from)
                .max(Comparator.naturalOrder())
                .orElse(currentYm);
        if (maxDataYm.isAfter(currentYm)) {
            currentYm = maxDataYm;
        }

        LocalDateTime startOfThisMonth = currentYm.atDay(1).atStartOfDay();
        LocalDateTime endOfThisMonth = currentYm.atEndOfMonth().atTime(23, 59, 59);

        LocalDateTime startOf3Months = currentYm.minusMonths(2).atDay(1).atStartOfDay();
        LocalDateTime endOf3Months = endOfThisMonth;

        BigDecimal thisMonthRental = BigDecimal.ZERO;
        BigDecimal thisMonthRefunds = BigDecimal.ZERO;
        BigDecimal last3MRental = BigDecimal.ZERO;
        BigDecimal last3MRefunds = BigDecimal.ZERO;
        BigDecimal allTimeRentalRev = BigDecimal.ZERO;
        BigDecimal allTimeRefundsRev = BigDecimal.ZERO;

        for (Payment p : payments) {
            String invNum = p.getInvoiceNumber() != null ? p.getInvoiceNumber() : "";
            boolean isPaid = "PAID".equalsIgnoreCase(p.getStatus()) 
                    || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus()) 
                    || "REFUNDED".equalsIgnoreCase(p.getStatus())
                    || "PARTIALLY_PAID".equalsIgnoreCase(p.getStatus());

            LocalDateTime paymentTime = p.getPaidAt() != null ? p.getPaidAt() : p.getIssuedAt();

            // Tính phần tiền thuê thực thu (trừ tiền cọc bảo lưu)
            BigDecimal rentPart = BigDecimal.ZERO;
            if ("DEP".equalsIgnoreCase(p.getInvoiceType()) && ("PAID".equalsIgnoreCase(p.getStatus()) || "PARTIALLY_PAID".equalsIgnoreCase(p.getStatus()) || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus()))) {
                BigDecimal depAmt = contracts.stream()
                        .filter(c -> c.getContractId().equals(p.getContractId()))
                        .findFirst()
                        .flatMap(c -> reservations.stream().filter(r -> r.getReservationId().equals(c.getReservationId())).findFirst())
                        .map(r -> r.getDepositAmount() != null ? r.getDepositAmount() : BigDecimal.ZERO)
                        .orElse(BigDecimal.ZERO);
                rentPart = (p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO).subtract(depAmt).max(BigDecimal.ZERO);
            } else if (("INITIAL_RENTAL".equalsIgnoreCase(p.getInvoiceType()) || "MONTHLY_RENEWAL".equalsIgnoreCase(p.getInvoiceType()) || "EXT".equalsIgnoreCase(p.getInvoiceType()) || "OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) || "PEN".equalsIgnoreCase(p.getInvoiceType()) || "CMP".equalsIgnoreCase(p.getInvoiceType()) || "INSPECTION_DAMAGE".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                rentPart = p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO;
            }

            boolean isRefund = (invNum.startsWith("REF-") || "REF".equalsIgnoreCase(p.getInvoiceType())) && isPaid;
            BigDecimal refAmt = isRefund ? (p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO) : BigDecimal.ZERO;

            if (paymentTime != null) {
                if (!paymentTime.isBefore(startOfThisMonth) && !paymentTime.isAfter(endOfThisMonth)) {
                    thisMonthRental = thisMonthRental.add(rentPart);
                    thisMonthRefunds = thisMonthRefunds.add(refAmt);
                }
                if (!paymentTime.isBefore(startOf3Months) && !paymentTime.isAfter(endOf3Months)) {
                    last3MRental = last3MRental.add(rentPart);
                    last3MRefunds = last3MRefunds.add(refAmt);
                }
            }
            allTimeRentalRev = allTimeRentalRev.add(rentPart);
            allTimeRefundsRev = allTimeRefundsRev.add(refAmt);

            if (fromLdt != null && paymentTime != null && paymentTime.isBefore(fromLdt)) {
                continue;
            }
            if (toLdt != null && paymentTime != null && paymentTime.isAfter(toLdt)) {
                continue;
            }

            if (isRefund) {
                totalRefunds = totalRefunds.add(p.getAmount());
            } else if ((invNum.startsWith("CMP-") || "CMP".equalsIgnoreCase(p.getInvoiceType()) || "INSPECTION_DAMAGE".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                compensationRevenue = compensationRevenue.add(p.getAmount());
            } else if (("OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) || "PEN".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                penaltyRevenue = penaltyRevenue.add(p.getAmount());
            } else if (("MONTHLY_RENEWAL".equalsIgnoreCase(p.getInvoiceType()) || "EXT".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                extensionRevenue = extensionRevenue.add(p.getAmount());
            } else if ("DEP".equalsIgnoreCase(p.getInvoiceType()) && ("PAID".equalsIgnoreCase(p.getStatus()) || "PARTIALLY_PAID".equalsIgnoreCase(p.getStatus()) || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus()))) {
                BigDecimal depAmt = contracts.stream()
                        .filter(c -> c.getContractId().equals(p.getContractId()))
                        .findFirst()
                        .flatMap(c -> reservations.stream().filter(r -> r.getReservationId().equals(c.getReservationId())).findFirst())
                        .map(r -> r.getDepositAmount() != null ? r.getDepositAmount() : BigDecimal.ZERO)
                        .orElse(BigDecimal.ZERO);
                rentalRevenue = rentalRevenue.add((p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO).subtract(depAmt).max(BigDecimal.ZERO));
            } else if ("INITIAL_RENTAL".equalsIgnoreCase(p.getInvoiceType()) && isPaid) {
                rentalRevenue = rentalRevenue.add(p.getAmount());
            }

            if ("CANCELLED".equalsIgnoreCase(p.getStatus())) {
                if ("OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) || "INSPECTION_DAMAGE".equalsIgnoreCase(p.getInvoiceType())
                        || "PEN".equalsIgnoreCase(p.getInvoiceType()) || "CMP".equalsIgnoreCase(p.getInvoiceType())) {
                    waivedAmount = waivedAmount.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                }
            }
        }
        for (Reservation r : reservations) {
            Optional<Contract> cOpt = contracts.stream().filter(c -> c.getReservationId().equals(r.getReservationId())).findFirst();
            if (cOpt.isPresent()) {
                String cStatus = cOpt.get().getStatus();
                if ("ACTIVE".equalsIgnoreCase(cStatus) || "PENDING_CHECKIN".equalsIgnoreCase(cStatus) || "OVERDUE".equalsIgnoreCase(cStatus)) {
                    if (r.getDepositAmount() != null) {
                        depositHolding = depositHolding.add(r.getDepositAmount());
                    }
                } else if ("CANCELLED".equalsIgnoreCase(cStatus) || "FORFEITED".equalsIgnoreCase(cStatus)) {
                    if (r.getDepositAmount() != null) {
                        Integer cId = cOpt.get().getContractId();
                        BigDecimal refundedForContract = payments.stream()
                                .filter(p -> cId.equals(p.getContractId()))
                                .filter(p -> "REF".equalsIgnoreCase(p.getInvoiceType())
                                        || (p.getInvoiceNumber() != null && p.getInvoiceNumber().startsWith("REF-")))
                                .filter(p -> !"CANCELLED".equalsIgnoreCase(p.getStatus()))
                                .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        forfeitedDeposit = forfeitedDeposit.add(r.getDepositAmount().subtract(refundedForContract).max(BigDecimal.ZERO));
                    }
                }
            }
        }

        BigDecimal grossRevenue = rentalRevenue.add(extensionRevenue).add(penaltyRevenue).add(compensationRevenue);
        BigDecimal netRevenue = grossRevenue.subtract(totalRefunds);

        // 4. Thống kê Support Ticket & SLA
        List<SupportTicket> allFacilityTickets = supportTicketRepository.findByFacilityIdOrderByCreatedAtDesc(facilityId);
        List<SupportTicket> tickets = allFacilityTickets.stream().filter(t -> {
            if (t.getCreatedAt() == null) return true;
            if (fromLdt != null && t.getCreatedAt().isBefore(fromLdt)) return false;
            if (toLdt != null && t.getCreatedAt().isAfter(toLdt)) return false;
            return true;
        }).collect(Collectors.toList());
        long totalTickets = tickets.size();
        long submittedTickets = tickets.stream().filter(t -> "SUBMITTED".equalsIgnoreCase(t.getStatus()) || "ESCALATED".equalsIgnoreCase(t.getStatus())).count();
        long inProgressTickets = tickets.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus())).count();
        long resolvedTickets = tickets.stream().filter(t -> "RESOLVED".equalsIgnoreCase(t.getStatus())).count();

        LocalDateTime now = LocalDateTime.now();
        long slaBreachedTickets = tickets.stream().filter(t -> {
            if ("ESCALATED".equalsIgnoreCase(t.getStatus()) || Boolean.TRUE.equals(t.getIsSlaBreached())) {
                return true;
            }
            if (!"RESOLVED".equalsIgnoreCase(t.getStatus()) && t.getSlaDeadline() != null) {
                return now.isAfter(t.getSlaDeadline());
            }
            return false;
        }).count();

        ManagerDashboardResponse resp = new ManagerDashboardResponse();
        resp.setFacilityId(facilityId);
        com.swp391.backend.dto.FacilityResponse mappedFac = storageService.mapFacilityToResponse(fac);
        resp.setFacilityName(mappedFac.getFacilityName());
        resp.setFacilityCode(mappedFac.getFacilityCode());

        // Lấy thông tin Quản lý chi nhánh (Manager) từ DB
        List<com.swp391.backend.entity.EmployeeProfile> employees = employeeProfileRepository.findAll();
        Optional<com.swp391.backend.entity.EmployeeProfile> mgrEmp = employees.stream()
                .filter(e -> facilityId.equals(e.getFacilityId()))
                .filter(e -> {
                    Optional<com.swp391.backend.entity.Account> acc = accountRepository.findAccountByAccountId(e.getAccountId());
                    return acc.isPresent() && Long.valueOf(3L).equals(acc.get().getRoleId());
                })
                .findFirst();

        if (mgrEmp.isPresent()) {
            accountRepository.findAccountByAccountId(mgrEmp.get().getAccountId()).ifPresent(acc -> {
                String rawName = acc.getFullName() != null ? acc.getFullName() : "";
                String cleanName = rawName.replaceAll("\\s*\\([A-Z0-9-]+\\)\\s*$", "").trim();
                resp.setManagerName(cleanName.isEmpty() ? rawName : cleanName);
                resp.setManagerEmail(acc.getEmail());
                resp.setManagerPhone(acc.getPhone());
            });
        }

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

        BigDecimal thisMonthNet = thisMonthRental.subtract(thisMonthRefunds);
        BigDecimal thisMonthDisplay = thisMonthNet.compareTo(BigDecimal.ZERO) > 0 ? thisMonthNet : thisMonthRental;
        resp.setThisMonthRevenue(thisMonthDisplay);

        BigDecimal last3MNet = last3MRental.subtract(last3MRefunds);
        BigDecimal last3MDisplay = last3MNet.compareTo(BigDecimal.ZERO) > 0 ? last3MNet : last3MRental;
        resp.setLast3MonthsRevenue(last3MDisplay);

        BigDecimal allTimeNetRev = allTimeRentalRev.subtract(allTimeRefundsRev);
        BigDecimal allTimeDisplay = allTimeNetRev.compareTo(BigDecimal.ZERO) > 0 ? allTimeNetRev : allTimeRentalRev;
        resp.setAllTimeRevenue(allTimeDisplay);

        resp.setDepositHolding(depositHolding);
        resp.setForfeitedDeposit(forfeitedDeposit);
        resp.setWaivedAmount(waivedAmount);

        // 5. Tính toán doanh thu thực tế 6 tháng gần nhất cho riêng cơ sở này
        java.time.YearMonth endFacYm = currentYm;
        List<java.time.YearMonth> facTargetMonths = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            facTargetMonths.add(endFacYm.minusMonths(i));
        }

        List<com.swp391.backend.dto.dashboard.MonthlyRevenueItemResponse> facilityMonthlyRevenues = new ArrayList<>();
        for (java.time.YearMonth ym : facTargetMonths) {
            BigDecimal mRental = BigDecimal.ZERO;
            BigDecimal mExtension = BigDecimal.ZERO;
            BigDecimal mPenalty = BigDecimal.ZERO;
            BigDecimal mCompensation = BigDecimal.ZERO;
            BigDecimal mRefunds = BigDecimal.ZERO;

            for (Payment p : payments) {
                LocalDateTime pTime = p.getPaidAt() != null ? p.getPaidAt() : p.getIssuedAt();
                if (pTime == null || !ym.equals(java.time.YearMonth.from(pTime))) {
                    continue;
                }

                String invNum = p.getInvoiceNumber() != null ? p.getInvoiceNumber() : "";
                boolean isPaid = "PAID".equalsIgnoreCase(p.getStatus()) 
                        || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus()) 
                        || "REFUNDED".equalsIgnoreCase(p.getStatus())
                        || "PARTIALLY_PAID".equalsIgnoreCase(p.getStatus());

                if ((invNum.startsWith("REF-") || "REF".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                    mRefunds = mRefunds.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                } else if ((invNum.startsWith("CMP-") || "CMP".equalsIgnoreCase(p.getInvoiceType()) || "INSPECTION_DAMAGE".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                    mCompensation = mCompensation.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                } else if (("OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) || "PEN".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                    mPenalty = mPenalty.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                } else if (("MONTHLY_RENEWAL".equalsIgnoreCase(p.getInvoiceType()) || "EXT".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                    mExtension = mExtension.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                } else if ("DEP".equalsIgnoreCase(p.getInvoiceType()) && ("PAID".equalsIgnoreCase(p.getStatus()) || "PARTIALLY_PAID".equalsIgnoreCase(p.getStatus()) || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus()))) {
                    BigDecimal depAmt = contracts.stream()
                            .filter(c -> c.getContractId().equals(p.getContractId()))
                            .findFirst()
                            .flatMap(c -> reservations.stream().filter(r -> r.getReservationId().equals(c.getReservationId())).findFirst())
                            .map(r -> r.getDepositAmount() != null ? r.getDepositAmount() : BigDecimal.ZERO)
                            .orElse(BigDecimal.ZERO);
                    mRental = mRental.add((p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO).subtract(depAmt).max(BigDecimal.ZERO));
                } else if ("INITIAL_RENTAL".equalsIgnoreCase(p.getInvoiceType()) && isPaid) {
                    mRental = mRental.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                }
            }

            BigDecimal mGross = mRental.add(mExtension).add(mPenalty).add(mCompensation);
            BigDecimal mNet = mGross.subtract(mRefunds);

            String monthCode = "T" + ym.getMonthValue();
            String monthLabel = String.format("Tháng %02d/%d", ym.getMonthValue(), ym.getYear());
            facilityMonthlyRevenues.add(new com.swp391.backend.dto.dashboard.MonthlyRevenueItemResponse(monthCode, monthLabel, mNet));
        }
        resp.setMonthlyRevenues(facilityMonthlyRevenues);
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
        return getChainDashboard(null, null, null);
    }

    public ChainDashboardResponse getChainDashboard(String fromStr, String toStr, String period) {
        List<Facility> facilities = facilityRepository.findAll();
        List<ManagerDashboardResponse> breakdown = new ArrayList<>();

        String effectiveFrom = fromStr;
        String effectiveTo = toStr;

        List<Payment> allPayments = paymentRepository.findAll();
        java.time.YearMonth currentYm = java.time.YearMonth.now();
        java.time.YearMonth maxPaymentYm = allPayments.stream()
                .map(p -> p.getPaidAt() != null ? p.getPaidAt() : p.getIssuedAt())
                .filter(Objects::nonNull)
                .map(java.time.YearMonth::from)
                .max(Comparator.naturalOrder())
                .orElse(currentYm);
        if (maxPaymentYm.isAfter(currentYm)) {
            currentYm = maxPaymentYm;
        }

        if (period != null && !period.isBlank()) {
            if ("this_month".equalsIgnoreCase(period.trim())) {
                effectiveFrom = currentYm.atDay(1).toString();
                effectiveTo = currentYm.atEndOfMonth().toString();
            } else if ("last_3_months".equalsIgnoreCase(period.trim())) {
                effectiveFrom = currentYm.minusMonths(2).atDay(1).toString();
                effectiveTo = currentYm.atEndOfMonth().toString();
            }
        }

        long chainTotalUnits = 0;
        long chainOccupiedUnits = 0;
        long chainTotalActive = 0;
        BigDecimal chainGross = BigDecimal.ZERO;
        BigDecimal chainRefunds = BigDecimal.ZERO;
        BigDecimal chainNet = BigDecimal.ZERO;
        BigDecimal chainDeposit = BigDecimal.ZERO;

        for (Facility f : facilities) {
            try {
                ManagerDashboardResponse mResp = getManagerDashboard(f.getFacilityId(), effectiveFrom, effectiveTo);
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

        // 4. Tính toán doanh thu thực tế từng tháng từ Database cho Biểu đồ
        List<Contract> allContracts = contractRepository.findAll();
        List<Reservation> allReservations = reservationRepository.findAll();

        java.time.YearMonth endYm = currentYm;
        List<java.time.YearMonth> targetMonths = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            targetMonths.add(endYm.minusMonths(i));
        }

        List<com.swp391.backend.dto.dashboard.MonthlyRevenueItemResponse> monthlyRevenueList = new ArrayList<>();
        for (java.time.YearMonth ym : targetMonths) {
            BigDecimal mRental = BigDecimal.ZERO;
            BigDecimal mExtension = BigDecimal.ZERO;
            BigDecimal mPenalty = BigDecimal.ZERO;
            BigDecimal mCompensation = BigDecimal.ZERO;
            BigDecimal mRefunds = BigDecimal.ZERO;

            for (Payment p : allPayments) {
                LocalDateTime pTime = p.getPaidAt() != null ? p.getPaidAt() : p.getIssuedAt();
                if (pTime == null || !ym.equals(java.time.YearMonth.from(pTime))) {
                    continue;
                }

                String invNum = p.getInvoiceNumber() != null ? p.getInvoiceNumber() : "";
                boolean isPaid = "PAID".equalsIgnoreCase(p.getStatus()) 
                        || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus()) 
                        || "REFUNDED".equalsIgnoreCase(p.getStatus())
                        || "PARTIALLY_PAID".equalsIgnoreCase(p.getStatus());

                if ((invNum.startsWith("REF-") || "REF".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                    mRefunds = mRefunds.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                } else if ((invNum.startsWith("CMP-") || "CMP".equalsIgnoreCase(p.getInvoiceType()) || "INSPECTION_DAMAGE".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                    mCompensation = mCompensation.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                } else if (("OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType()) || "PEN".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                    mPenalty = mPenalty.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                } else if (("MONTHLY_RENEWAL".equalsIgnoreCase(p.getInvoiceType()) || "EXT".equalsIgnoreCase(p.getInvoiceType())) && isPaid) {
                    mExtension = mExtension.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                } else if ("DEP".equalsIgnoreCase(p.getInvoiceType()) && ("PAID".equalsIgnoreCase(p.getStatus()) || "PARTIALLY_PAID".equalsIgnoreCase(p.getStatus()) || "SUCCESS".equalsIgnoreCase(p.getPaymentStatus()))) {
                    BigDecimal depAmt = allContracts.stream()
                            .filter(c -> c.getContractId().equals(p.getContractId()))
                            .findFirst()
                            .flatMap(c -> allReservations.stream().filter(r -> r.getReservationId().equals(c.getReservationId())).findFirst())
                            .map(r -> r.getDepositAmount() != null ? r.getDepositAmount() : BigDecimal.ZERO)
                            .orElse(BigDecimal.ZERO);
                    mRental = mRental.add((p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO).subtract(depAmt).max(BigDecimal.ZERO));
                } else if ("INITIAL_RENTAL".equalsIgnoreCase(p.getInvoiceType()) && isPaid) {
                    mRental = mRental.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                }
            }

            BigDecimal mGross = mRental.add(mExtension).add(mPenalty).add(mCompensation);
            BigDecimal mNet = mGross.subtract(mRefunds);

            String monthCode = "T" + ym.getMonthValue();
            String monthLabel = String.format("Tháng %02d/%d", ym.getMonthValue(), ym.getYear());
            monthlyRevenueList.add(new com.swp391.backend.dto.dashboard.MonthlyRevenueItemResponse(monthCode, monthLabel, mNet));
        }

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
        resp.setMonthlyRevenues(monthlyRevenueList);

        return resp;
    }
}
