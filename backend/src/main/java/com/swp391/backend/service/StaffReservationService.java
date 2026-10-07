package com.swp391.backend.service;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.StaffCheckInRequest;
import com.swp391.backend.dto.StaffCheckInResponse;
import com.swp391.backend.dto.StaffReservationListItemResponse;
import com.swp391.backend.dto.StaffReservationListResponse;
import com.swp391.backend.dto.StaffReservationLookupResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class StaffReservationService {

    private static final String CONTRACT_PENDING_CHECKIN = "PENDING_CHECKIN";
    private static final String RESERVATION_PENDING = "PENDING";
    private static final String RESERVATION_CONFIRMED = "CONFIRMED";

    private final ReservationRepository reservationRepository;
    private final AccountRepository accountRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final FloorRepository floorRepository;
    private final ActivityLogRepository activityLogRepository;
    private final StorageService storageService;

    public StaffReservationService(
            ReservationRepository reservationRepository,
            AccountRepository accountRepository,
            ContractRepository contractRepository,
            PaymentRepository paymentRepository,
            StorageUnitRepository storageUnitRepository,
            EmployeeProfileRepository employeeProfileRepository,
            FloorRepository floorRepository,
            ActivityLogRepository activityLogRepository,
            StorageService storageService) {
        this.reservationRepository = reservationRepository;
        this.accountRepository = accountRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.floorRepository = floorRepository;
        this.activityLogRepository = activityLogRepository;
        this.storageService = storageService;
    }

    public StaffReservationListResponse listReservations() {
        Integer accountId = getAuthenticatedAccountId();
        if (accountId == null) {
            return new StaffReservationListResponse(false, "Authenticated staff account was not found.", List.of());
        }
        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(accountId);
        if (employee.isEmpty()) {
            return new StaffReservationListResponse(false, "Employee profile was not found.", List.of());
        }

        List<StaffReservationListItemResponse> reservations = reservationRepository
                .findByFacilityId(employee.get().getFacilityId()).stream()
                .map(this::toListItem)
                .sorted(Comparator
                        .comparing((StaffReservationListItemResponse item) ->
                                !CONTRACT_PENDING_CHECKIN.equals(item.getContractStatus()))
                        .thenComparing(StaffReservationListItemResponse::getCheckInDate,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        return new StaffReservationListResponse(true, "Reservations loaded.", reservations);
    }

    public StaffReservationLookupResponse lookupReservation(String reservationCode) {
        StaffReservationLookupResponse response = new StaffReservationLookupResponse();
        if (reservationCode == null || reservationCode.isBlank()) {
            response.setSuccess(false);
            response.setMessage("Reservation code is required.");
            return response;
        }

        Integer accountId = getAuthenticatedAccountId();
        if (accountId == null) {
            response.setSuccess(false);
            response.setMessage("Authenticated staff account was not found.");
            return response;
        }
        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(accountId);
        if (employee.isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Employee profile was not found.");
            return response;
        }

        Optional<Reservation> reservation = reservationRepository.findByReservationCode(reservationCode.trim());
        if (reservation.isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Reservation was not found.");
            return response;
        }
        Optional<StorageUnit> unit = storageUnitRepository.findById(reservation.get().getUnitCode());
        if (unit.isEmpty() || !belongsToFacility(unit.get(), employee.get().getFacilityId())) {
            response.setSuccess(false);
            response.setMessage("Reservation was not found in the staff member's facility.");
            return response;
        }

        StaffReservationListItemResponse item = toListItem(reservation.get());
        copyListItem(item, response);
        response.setUnitStatus(unit.get().getStatus());
        contractRepository.findByReservationId(reservation.get().getReservationId())
                .ifPresent(contract -> response.setContractPdfUrl(contract.getPdfUrl()));
        response.setSuccess(true);
        response.setMessage("Reservation found.");
        return response;
    }

    @Transactional
    public StaffCheckInResponse checkIn(Integer reservationId, StaffCheckInRequest request) {
        Integer staffAccountId = getAuthenticatedAccountId();
        if (staffAccountId == null) {
            return checkInFailure("Authenticated staff account was not found.");
        }
        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(staffAccountId);
        if (employee.isEmpty()) {
            return checkInFailure("Employee profile was not found.");
        }
        if (request == null || request.getCollectedAmount() == null
                || request.getCollectedAmount().signum() <= 0) {
            return checkInFailure("A positive collectedAmount is required.");
        }
        String paymentMethod = request.getPaymentMethod() == null
                ? "" : request.getPaymentMethod().trim().toUpperCase();
        if (!"CASH".equals(paymentMethod) && !"BANK_TRANSFER".equals(paymentMethod)) {
            return checkInFailure("paymentMethod must be CASH or BANK_TRANSFER.");
        }

        Optional<Reservation> reservationOpt = reservationRepository.findByReservationIdForUpdate(reservationId);
        if (reservationOpt.isEmpty()) {
            return checkInFailure("Reservation was not found.");
        }
        Reservation reservation = reservationOpt.get();

        Optional<Contract> contractOpt = contractRepository.findByReservationIdForUpdate(reservationId);
        if (contractOpt.isEmpty()) {
            return checkInFailure("Contract was not found.");
        }
        Contract contract = contractOpt.get();
        if (!CONTRACT_PENDING_CHECKIN.equals(contract.getStatus())) {
            return checkInFailure("Contract must be PENDING_CHECKIN to check in.");
        }

        Optional<StorageUnit> unitOpt = storageUnitRepository.findByUnitCodeForUpdate(reservation.getUnitCode());
        if (unitOpt.isEmpty()) {
            return checkInFailure("Reservation storage unit was not found.");
        }
        StorageUnit unit = unitOpt.get();

        List<Payment> deposits = paymentRepository.findPartiallyPaidDepByContractIdForUpdate(contract.getContractId())
                .stream()
                .filter(payment -> "SUCCESS".equalsIgnoreCase(payment.getPaymentStatus()))
                .toList();
        if (deposits.size() != 1) {
            return checkInFailure("Exactly one successful DEP invoice in PARTIALLY_PAID status is required.");
        }
        Payment deposit = deposits.get(0);

        if (!belongsToFacility(unit, employee.get().getFacilityId())) {
            return checkInFailure("Reservation was not found in the staff member's facility.");
        }
        if (!"RESERVED".equals(unit.getStatus())) {
            return checkInFailure("Storage unit must be RESERVED to check in.");
        }
        BigDecimal remainingAmount = deposit.getRemainingAmount();
        if (remainingAmount == null || remainingAmount.signum() <= 0) {
            return checkInFailure("DEP must have a positive remainingAmount.");
        }
        if (request.getCollectedAmount().compareTo(remainingAmount) != 0) {
            return checkInFailure("collectedAmount must equal the DEP remainingAmount of " + remainingAmount + ".");
        }

        LocalDateTime now = LocalDateTime.now();
        deposit.setPaidAmount(deposit.getAmount());
        deposit.setRemainingAmount(BigDecimal.ZERO);
        deposit.setStatus("PAID");
        deposit.setPaymentStatus("SUCCESS");
        deposit.setPaymentMethod(paymentMethod);
        deposit.setPaidAt(now);
        paymentRepository.save(deposit);

        contract.setStatus("ACTIVE");
        contract.setActivatedAt(now);
        unit.setStatus("RENTED");
        contractRepository.save(contract);
        storageUnitRepository.save(unit);

        writeActivityLog(staffAccountId, "STAFF_RESERVATION_CHECK_IN",
                "RES " + reservation.getReservationCode() + " (id=" + reservationId
                        + "): collected " + request.getCollectedAmount() + " via " + paymentMethod
                        + "; contract=ACTIVE; unit=RENTED; result=SUCCESS");

        StaffCheckInResponse response = new StaffCheckInResponse(true, "Check-in completed.");
        response.setReservationId(reservationId);
        response.setReservationCode(reservation.getReservationCode());
        response.setContractStatus(contract.getStatus());
        response.setUnitStatus(unit.getStatus());
        response.setCollectedAmount(request.getCollectedAmount());
        response.setRemainingAmount(BigDecimal.ZERO);
        return response;
    }

    @Transactional
    public ApiResponse changeUnit(Integer reservationId, String newUnitCode) {
        Integer staffAccountId = getAuthenticatedAccountId();
        if (staffAccountId == null) {
            return failure("Authenticated staff account was not found in SecurityContext.");
        }

        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(staffAccountId);
        if (employee.isEmpty()) {
            return failure("Employee profile was not found for the authenticated account.");
        }
        Integer staffFacilityId = employee.get().getFacilityId();

        Optional<Reservation> reservationOpt = reservationRepository.findByReservationIdForUpdate(reservationId);
        if (reservationOpt.isEmpty()) {
            return failure("Reservation was not found.");
        }
        Reservation reservation = reservationOpt.get();
        if (!isChangeableReservation(reservation)) {
            return failure("Reservation is not in a changeable status.");
        }

        Optional<Contract> contractOpt = contractRepository.findByReservationId(reservation.getReservationId());
        if (contractOpt.isEmpty() || !CONTRACT_PENDING_CHECKIN.equals(contractOpt.get().getStatus())) {
            return failure("A PENDING_CHECKIN contract is required to change the storage unit.");
        }
        Contract contract = contractOpt.get();

        String oldUnitCode = reservation.getUnitCode();
        if (newUnitCode == null || newUnitCode.isBlank()) {
            return failure("New unit code is required.");
        }
        newUnitCode = newUnitCode.trim();
        if (oldUnitCode.equals(newUnitCode)) {
            return failure("New unit must be different from the current unit.");
        }

        LockedUnits lockedUnits = lockUnitsInStableOrder(oldUnitCode, newUnitCode);
        if (lockedUnits.oldUnit().isEmpty()) {
            return failure("Current storage unit was not found.");
        }
        if (lockedUnits.newUnit().isEmpty()) {
            return failure("New storage unit was not found.");
        }
        StorageUnit oldUnit = lockedUnits.oldUnit().get();
        StorageUnit newUnit = lockedUnits.newUnit().get();

        if (!belongsToFacility(oldUnit, staffFacilityId) || !belongsToFacility(newUnit, staffFacilityId)) {
            return failure("Both storage units must belong to the staff member's facility.");
        }
        if (!"RESERVED".equals(oldUnit.getStatus())) {
            return failure("Current storage unit must have RESERVED status.");
        }
        if (!"AVAILABLE".equals(newUnit.getStatus())) {
            return failure("New storage unit must have AVAILABLE status.");
        }

        List<Payment> depositInvoices = findDepositInvoices(contract.getContractId());
        if (depositInvoices.size() != 1) {
            return failure("Exactly one DEP or legacy INITIAL_RENTAL invoice is required to recalculate the deposit.");
        }
        Payment depositInvoice = depositInvoices.get(0);

        int duration = (int) Math.max(1L, ChronoUnit.DAYS.between(reservation.getStartDate(), reservation.getEndDate()));
        CalculatePriceResponse newPrice = storageService.calculateRentalPrice(
                new CalculatePriceRequest(newUnit.getUnitTypeId(), reservation.getRentalType(), duration));
        if (!newPrice.isSuccess()) {
            return failure("Unable to calculate the new unit price: " + newPrice.getMessage());
        }

        BigDecimal totalNew = zeroIfNull(newPrice.getFinalRentalAmount()).add(zeroIfNull(newPrice.getDepositAmount()));
        BigDecimal paid = getActualPaidAmount(depositInvoice);
        BigDecimal remaining = totalNew.subtract(paid);

        depositInvoice.setAmount(totalNew);
        depositInvoice.setPaidAmount(paid);
        depositInvoice.setRemainingAmount(remaining.max(BigDecimal.ZERO));
        depositInvoice.setStatus(remaining.signum() > 0 ? "PENDING" : "PAID");
        paymentRepository.save(depositInvoice);

        BigDecimal refundAmount = BigDecimal.ZERO;
        if (remaining.signum() < 0) {
            refundAmount = remaining.abs();
            createRefundRequest(contract.getContractId(), refundAmount);
        }

        reservation.setUnitCode(newUnit.getUnitCode());
        reservation.setRentalAmount(newPrice.getFinalRentalAmount());
        reservation.setDepositAmount(newPrice.getDepositAmount());
        oldUnit.setStatus("AVAILABLE");
        newUnit.setStatus("RESERVED");
        storageUnitRepository.save(oldUnit);
        storageUnitRepository.save(newUnit);
        reservationRepository.save(reservation);

        String result = remaining.signum() > 0
                ? "remaining due at counter=" + remaining
                : "refund request=" + refundAmount;
        writeActivityLog(staffAccountId, "STAFF_CHANGE_UNIT",
                "RES " + reservation.getReservationId() + ": old unit " + oldUnitCode
                        + " -> new unit " + newUnit.getUnitCode() + "; " + result + "; result=SUCCESS");

        return new ApiResponse(true, "Storage unit changed. " + result + ".");
    }

    @Transactional
    public ApiResponse cancelReservation(Integer reservationId) {
        Integer staffAccountId = getAuthenticatedAccountId();
        if (staffAccountId == null) {
            return failure("Authenticated staff account was not found in SecurityContext.");
        }

        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(staffAccountId);
        if (employee.isEmpty()) {
            return failure("Employee profile was not found for the authenticated account.");
        }
        Integer staffFacilityId = employee.get().getFacilityId();

        Optional<Reservation> reservationOpt = reservationRepository.findByReservationIdForUpdate(reservationId);
        if (reservationOpt.isEmpty()) {
            return failure("Reservation was not found.");
        }
        Reservation reservation = reservationOpt.get();
        if (!isChangeableReservation(reservation)) {
            return failure("Reservation is not in a cancellable status.");
        }

        Optional<Contract> contractOpt = contractRepository.findByReservationId(reservation.getReservationId());
        if (contractOpt.isEmpty() || !CONTRACT_PENDING_CHECKIN.equals(contractOpt.get().getStatus())) {
            return failure("A PENDING_CHECKIN contract is required to cancel the reservation.");
        }
        Contract contract = contractOpt.get();

        Optional<StorageUnit> unitOpt = storageUnitRepository.findByUnitCodeForUpdate(reservation.getUnitCode());
        if (unitOpt.isEmpty()) {
            return failure("Reservation storage unit was not found.");
        }
        StorageUnit unit = unitOpt.get();
        if (!belongsToFacility(unit, staffFacilityId)) {
            return failure("Reservation storage unit does not belong to the staff member's facility.");
        }
        if (!"RESERVED".equals(unit.getStatus())) {
            return failure("Reservation storage unit must have RESERVED status to be released.");
        }

        List<Payment> depositInvoices = findDepositInvoices(contract.getContractId());
        BigDecimal paidDeposit = depositInvoices.stream()
                .map(this::getActualPaidAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal refundAmount = BigDecimal.ZERO;
        BigDecimal penaltyAmount = BigDecimal.ZERO;
        if (paidDeposit.signum() > 0) {
            long diffDays = ChronoUnit.DAYS.between(LocalDate.now(), reservation.getStartDate());
            BigDecimal refundRate = diffDays >= 4 ? BigDecimal.ONE : new BigDecimal("0.50");
            refundAmount = paidDeposit.multiply(refundRate).setScale(2, java.math.RoundingMode.HALF_UP);
            penaltyAmount = paidDeposit.subtract(refundAmount);
            if (refundAmount.signum() > 0) {
                createRefundRequest(contract.getContractId(), refundAmount);
            }
        }

        reservation.setPenaltyAmount(penaltyAmount);
        reservation.setStatus("CANCELLED");
        contract.setStatus("CANCELED");
        contract.setTerminatedAt(LocalDateTime.now());
        unit.setStatus("AVAILABLE");
        for (Payment invoice : depositInvoices) {
            invoice.setStatus("CANCELLED");
            paymentRepository.save(invoice);
        }

        reservationRepository.save(reservation);
        contractRepository.save(contract);
        storageUnitRepository.save(unit);

        writeActivityLog(staffAccountId, "STAFF_CANCEL_RESERVATION",
                "RES " + reservation.getReservationId() + ": refund amount=" + refundAmount
                        + "; penalty amount=" + penaltyAmount + "; result=SUCCESS");

        return new ApiResponse(true,
                "Reservation cancelled. Refund request=" + refundAmount + ", penalty=" + penaltyAmount + ".");
    }

    private LockedUnits lockUnitsInStableOrder(String oldUnitCode, String newUnitCode) {
        boolean oldFirst = oldUnitCode.compareTo(newUnitCode) < 0;
        String firstCode = oldFirst ? oldUnitCode : newUnitCode;
        String secondCode = oldFirst ? newUnitCode : oldUnitCode;
        Optional<StorageUnit> first = storageUnitRepository.findByUnitCodeForUpdate(firstCode);
        Optional<StorageUnit> second = storageUnitRepository.findByUnitCodeForUpdate(secondCode);
        return oldFirst
                ? new LockedUnits(first, second)
                : new LockedUnits(second, first);
    }

    private boolean belongsToFacility(StorageUnit unit, Integer facilityId) {
        return floorRepository.findById(unit.getFloorId())
                .map(floor -> facilityId.equals(floor.getFacilityId()))
                .orElse(false);
    }

    private boolean isChangeableReservation(Reservation reservation) {
        return RESERVATION_PENDING.equals(reservation.getStatus())
                || RESERVATION_CONFIRMED.equals(reservation.getStatus());
    }

    private List<Payment> findDepositInvoices(Integer contractId) {
        return paymentRepository.findByContractId(contractId).stream()
                .filter(payment -> "DEP".equals(payment.getInvoiceType())
                        || "INITIAL_RENTAL".equals(payment.getInvoiceType()))
                .sorted(Comparator.comparing(Payment::getPaymentId))
                .toList();
    }

    private BigDecimal getActualPaidAmount(Payment payment) {
        if (payment.getPaidAmount() != null && payment.getPaidAmount().signum() > 0) {
            return payment.getPaidAmount();
        }
        if ("PAID".equals(payment.getStatus()) && "SUCCESS".equals(payment.getPaymentStatus())) {
            return zeroIfNull(payment.getAmount());
        }
        return BigDecimal.ZERO;
    }

    private void createRefundRequest(Integer contractId, BigDecimal refundAmount) {
        if (refundAmount.signum() <= 0) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        Payment refund = new Payment();
        refund.setContractId(contractId);
        refund.setInvoiceNumber("REF-" + contractId + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20));
        refund.setInvoiceType("REF");
        refund.setAmount(refundAmount);
        refund.setPaidAmount(BigDecimal.ZERO);
        refund.setRemainingAmount(refundAmount);
        refund.setIssuedAt(now);
        refund.setDueAt(now);
        refund.setStatus("PENDING");
        refund.setPaymentStatus("PENDING");
        paymentRepository.save(refund);
    }

    private void writeActivityLog(Integer accountId, String action, String description) {
        ActivityLog log = new ActivityLog();
        log.setAccountId(accountId);
        log.setAction(action);
        log.setDescription(description);
        log.setCreatedAt(LocalDateTime.now());
        log.setIpAddress(getRequestIpAddress());
        activityLogRepository.save(log);
    }

    private String getRequestIpAddress() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest().getRemoteAddr();
        }
        return null;
    }

    private StaffReservationListItemResponse toListItem(Reservation reservation) {
        StaffReservationListItemResponse item = new StaffReservationListItemResponse();
        item.setReservationId(reservation.getReservationId());
        item.setReservationCode(reservation.getReservationCode());
        item.setReservationStatus(reservation.getStatus());
        item.setCheckInDate(reservation.getStartDate());
        accountRepository.findAccountByAccountId(reservation.getAccountId()).ifPresent(account -> {
            item.setCustomerName(account.getFullName());
            item.setCustomerPhone(account.getPhone());
        });
        storageUnitRepository.findById(reservation.getUnitCode()).ifPresent(unit -> {
            item.setUnitCode(unit.getUnitCode());
            floorRepository.findById(unit.getFloorId()).ifPresent(floor -> item.setFloorName(floor.getFloorName()));
        });

        contractRepository.findByReservationId(reservation.getReservationId()).ifPresent(contract -> {
            item.setContractStatus(contract.getStatus());
            paymentRepository.findByContractId(contract.getContractId()).stream()
                    .filter(payment -> "DEP".equalsIgnoreCase(payment.getInvoiceType())
                            || "INITIAL_RENTAL".equalsIgnoreCase(payment.getInvoiceType()))
                    .max(Comparator.comparing(Payment::getPaymentId))
                    .ifPresent(payment -> {
                        item.setDepStatus(payment.getStatus());
                        item.setDepPaymentStatus(payment.getPaymentStatus());
                        item.setDepAmount(payment.getAmount());
                        item.setDepPaidAmount(payment.getPaidAmount());
                        item.setDepRemainingAmount(payment.getRemainingAmount());
                    });
        });
        return item;
    }

    private void copyListItem(StaffReservationListItemResponse source,
                              StaffReservationLookupResponse target) {
        target.setReservationId(source.getReservationId());
        target.setReservationCode(source.getReservationCode());
        target.setCustomerName(source.getCustomerName());
        target.setCustomerPhone(source.getCustomerPhone());
        target.setUnitCode(source.getUnitCode());
        target.setFloorName(source.getFloorName());
        target.setReservationStatus(source.getReservationStatus());
        target.setCheckInDate(source.getCheckInDate());
        target.setContractStatus(source.getContractStatus());
        target.setDepStatus(source.getDepStatus());
        target.setDepPaymentStatus(source.getDepPaymentStatus());
        target.setDepAmount(source.getDepAmount());
        target.setDepPaidAmount(source.getDepPaidAmount());
        target.setDepRemainingAmount(source.getDepRemainingAmount());
    }

    private StaffCheckInResponse checkInFailure(String message) {
        return new StaffCheckInResponse(false, message);
    }

    private Integer getAuthenticatedAccountId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        return principal instanceof Integer accountId ? accountId : null;
    }

    private BigDecimal zeroIfNull(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private ApiResponse failure(String message) {
        return new ApiResponse(false, message);
    }

    private record LockedUnits(Optional<StorageUnit> oldUnit, Optional<StorageUnit> newUnit) {
    }
}
