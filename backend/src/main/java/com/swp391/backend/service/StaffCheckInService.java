package com.swp391.backend.service;

import com.swp391.backend.dto.GatePinResult;
import com.swp391.backend.dto.StaffCheckInRequest;
import com.swp391.backend.dto.StaffCheckInResponse;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.ActivityLogRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StaffCheckInService {

    private static final String CONTRACT_PENDING_CHECKIN = "PENDING_CHECKIN";
    private static final String RESERVATION_CONFIRMED = "CONFIRMED";

    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final FloorRepository floorRepository;
    private final ActivityLogRepository activityLogRepository;
    private final GatePinService gatePinService;

    public StaffCheckInService(
            ReservationRepository reservationRepository,
            ContractRepository contractRepository,
            PaymentRepository paymentRepository,
            StorageUnitRepository storageUnitRepository,
            EmployeeProfileRepository employeeProfileRepository,
            FloorRepository floorRepository,
            ActivityLogRepository activityLogRepository,
            GatePinService gatePinService) {
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.floorRepository = floorRepository;
        this.activityLogRepository = activityLogRepository;
        this.gatePinService = gatePinService;
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
                ? ""
                : request.getPaymentMethod().trim().toUpperCase();
        if (!"CASH".equals(paymentMethod) && !"BANK_TRANSFER".equals(paymentMethod)) {
            return checkInFailure("paymentMethod must be CASH or BANK_TRANSFER.");
        }

        Optional<Reservation> reservationOpt = reservationRepository.findByReservationIdForUpdate(reservationId);
        if (reservationOpt.isEmpty()) {
            return checkInFailure("Reservation was not found.");
        }
        Reservation reservation = reservationOpt.get();
        if (!RESERVATION_CONFIRMED.equals(reservation.getStatus())) {
            return checkInFailure("Reservation must be CONFIRMED to check in.");
        }

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
        BigDecimal oldPaidAmount = deposit.getPaidAmount() == null
                ? BigDecimal.ZERO
                : deposit.getPaidAmount();

        deposit.setPaidAmount(oldPaidAmount.add(request.getCollectedAmount()));
        deposit.setRemainingAmount(BigDecimal.ZERO);
        deposit.setStatus("PAID");
        deposit.setPaymentStatus("SUCCESS");
        deposit.setPaymentMethod(paymentMethod);
        deposit.setPaidAt(now);

        paymentRepository.save(deposit);
        contract.setStatus("ACTIVE");
        contract.setActivatedAt(now);
        unit.setStatus("OCCUPIED");
        GatePinResult gatePin = gatePinService.generatePin(contract);
        contractRepository.save(contract);
        storageUnitRepository.save(unit);

        writeActivityLog(staffAccountId, "STAFF_RESERVATION_CHECK_IN",
                "RES " + reservation.getReservationCode() + " (id=" + reservationId
                        + "): collected " + request.getCollectedAmount() + " via " + paymentMethod
                        + "; contract=ACTIVE; unit=OCCUPIED; result=SUCCESS");

        StaffCheckInResponse response = new StaffCheckInResponse(true, "Check-in completed.");
        response.setReservationId(reservationId);
        response.setReservationCode(reservation.getReservationCode());
        response.setContractStatus(contract.getStatus());
        response.setUnitStatus(unit.getStatus());
        response.setCollectedAmount(request.getCollectedAmount());
        response.setGatePin(gatePin.getPin());
        response.setInvoicePdfUrl(contract.getPdfUrl());
        response.setRemainingAmount(BigDecimal.ZERO);
        return response;
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

    private boolean belongsToFacility(StorageUnit unit, Integer facilityId) {
        return floorRepository.findById(unit.getFloorId())
                .map(floor -> facilityId.equals(floor.getFacilityId()))
                .orElse(false);
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
}
