package com.swp391.backend.service;

import com.swp391.backend.dto.GatePinResult;
import com.swp391.backend.dto.StaffCheckInRequest;
import com.swp391.backend.dto.StaffCheckInResponse;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class StaffCheckInService {

    private static final Logger log = LoggerFactory.getLogger(StaffCheckInService.class);

    private static final String CONTRACT_PENDING_CHECKIN = "PENDING_CHECKIN";
    private static final String RESERVATION_CONFIRMED = "CONFIRMED";

    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final FloorRepository floorRepository;
    private final ActivityLogRepository activityLogRepository;
    private final AccountRepository accountRepository;
    private final GatePinService gatePinService;
    private final EmailService emailService;

    public StaffCheckInService(
            ReservationRepository reservationRepository,
            ContractRepository contractRepository,
            PaymentRepository paymentRepository,
            StorageUnitRepository storageUnitRepository,
            EmployeeProfileRepository employeeProfileRepository,
            FloorRepository floorRepository,
            ActivityLogRepository activityLogRepository,
            AccountRepository accountRepository,
            GatePinService gatePinService,
            EmailService emailService) {
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.floorRepository = floorRepository;
        this.activityLogRepository = activityLogRepository;
        this.accountRepository = accountRepository;
        this.gatePinService = gatePinService;
        this.emailService = emailService;
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
        if (request == null) {
            return checkInFailure("Dữ liệu yêu cầu check-in không được để trống.");
        }
        String paymentMethod = request.getPaymentMethod() == null
                ? "CASH"
                : request.getPaymentMethod().trim().toUpperCase();
        if (!"CASH".equals(paymentMethod) && !"BANK_TRANSFER".equals(paymentMethod)) {
            paymentMethod = "CASH";
        }

        Optional<Reservation> reservationOpt = reservationRepository.findByReservationIdForUpdate(reservationId);
        if (reservationOpt.isEmpty()) {
            return checkInFailure("Không tìm thấy thông tin đặt chỗ.");
        }
        Reservation reservation = reservationOpt.get();
        // Hợp đồng đã chuyển sang trang staff (PENDING_CHECKIN) thì 100% đã cọc đủ
        if (!"CONFIRMED".equalsIgnoreCase(reservation.getStatus()) && !"PENDING".equalsIgnoreCase(reservation.getStatus())) {
            return checkInFailure("Đơn đặt chỗ không ở trạng thái hợp lệ để làm thủ tục check-in.");
        }

        Optional<Contract> contractOpt = contractRepository.findByReservationIdForUpdate(reservationId);
        if (contractOpt.isEmpty()) {
            return checkInFailure("Không tìm thấy hợp đồng của đặt chỗ này.");
        }
        Contract contract = contractOpt.get();
        if (!CONTRACT_PENDING_CHECKIN.equalsIgnoreCase(contract.getStatus())) {
            return checkInFailure("Hợp đồng phải ở trạng thái PENDING_CHECKIN để check-in.");
        }

        Optional<StorageUnit> unitOpt = storageUnitRepository.findByUnitCodeForUpdate(reservation.getUnitCode());
        if (unitOpt.isEmpty()) {
            return checkInFailure("Không tìm thấy ô kho tương ứng.");
        }
        StorageUnit unit = unitOpt.get();

        if (!belongsToFacility(unit, employee.get().getFacilityId())) {
            return checkInFailure("Ô kho không thuộc cơ sở do nhân viên quản lý.");
        }
        if (!"RESERVED".equalsIgnoreCase(unit.getStatus()) && !"HOLD".equalsIgnoreCase(unit.getStatus()) && !"AVAILABLE".equalsIgnoreCase(unit.getStatus())) {
            return checkInFailure("Ô kho không ở trạng thái sẵn sàng để làm thủ tục bàn giao.");
        }

        List<Payment> deposits = paymentRepository.findDepositInvoicesForUpdate(contract.getContractId());
        Payment deposit = !deposits.isEmpty() ? deposits.get(0) : null;

        BigDecimal totalAmount = deposit != null && deposit.getAmount() != null
                ? deposit.getAmount()
                : (reservation.getRentalAmount() != null ? reservation.getRentalAmount() : BigDecimal.ZERO);
        BigDecimal depAmount = reservation.getDepositAmount() != null ? reservation.getDepositAmount() : BigDecimal.ZERO;
        BigDecimal paidSoFar = deposit != null && deposit.getPaidAmount() != null ? deposit.getPaidAmount() : BigDecimal.ZERO;

        if (paidSoFar.compareTo(depAmount) < 0) {
            paidSoFar = depAmount;
        }

        BigDecimal remainingAmount = totalAmount.subtract(paidSoFar);
        if (remainingAmount.signum() < 0) {
            remainingAmount = BigDecimal.ZERO;
        }

        BigDecimal collectedAmount = request.getCollectedAmount() == null
                ? BigDecimal.ZERO
                : request.getCollectedAmount();

        // Kiểm tra số tiền thu tại quầy: chấp nhận số tiền còn lại (tiền thuê) hoặc tổng tiền
        if (remainingAmount.signum() > 0) {
            if (collectedAmount.compareTo(remainingAmount) != 0 && collectedAmount.compareTo(totalAmount) != 0) {
                return checkInFailure("Số tiền thu tại quầy (" + collectedAmount
                        + ") phải khớp với số tiền cần thu (" + remainingAmount + ").");
            }
        } else {
            collectedAmount = BigDecimal.ZERO;
        }

        LocalDateTime now = LocalDateTime.now();
        if (deposit != null) {
            deposit.setPaidAmount(totalAmount);
            deposit.setRemainingAmount(BigDecimal.ZERO);
            deposit.setStatus("PAID");
            deposit.setPaymentStatus("SUCCESS");
            if (collectedAmount.signum() > 0) {
                deposit.setPaymentMethod(paymentMethod);
            }
            deposit.setPaidAt(now);
            paymentRepository.save(deposit);
        }

        // Chuyển đổi trạng thái hợp đồng sang CÓ HIỆU LỰC (ACTIVE)
        contract.setStatus("ACTIVE");
        contract.setActivatedAt(now);
        unit.setStatus("OCCUPIED");
        reservation.setStatus("CONFIRMED");

        reservationRepository.save(reservation);
        contractRepository.save(contract);
        storageUnitRepository.save(unit);

        GatePinResult gatePin = gatePinService.generatePin(contract);

        writeActivityLog(staffAccountId, "STAFF_RESERVATION_CHECK_IN",
                "RES " + reservation.getReservationCode() + " (id=" + reservationId
                        + "): collected " + collectedAmount + " via " + paymentMethod
                        + "; contract=ACTIVE; unit=OCCUPIED; result=SUCCESS");

        sendCheckInEmail(reservation, contract, gatePin.getPin());

        StaffCheckInResponse response = new StaffCheckInResponse(true, "Thủ tục check-in và bàn giao kho thành công.");
        response.setReservationId(reservationId);
        response.setReservationCode(reservation.getReservationCode());
        response.setContractStatus(contract.getStatus());
        response.setUnitStatus(unit.getStatus());
        response.setCollectedAmount(collectedAmount);
        response.setGatePin(gatePin.getPin());
        response.setRemainingAmount(BigDecimal.ZERO);
        return response;
    }

    private void sendCheckInEmail(Reservation reservation, Contract contract, String gatePin) {
        Optional<Account> accountOpt = accountRepository.findAccountByAccountId(reservation.getAccountId());
        if (accountOpt.isEmpty() || accountOpt.get().getEmail() == null
                || accountOpt.get().getEmail().isBlank()) {
            log.warn("Cannot send check-in email: customer email was not found for accountId={}",
                    reservation.getAccountId());
            return;
        }

        Account account = accountOpt.get();
        String content = "Hello " + account.getFullName() + ",\n\n"
                + "Your storage check-in has been completed successfully.\n"
                + "Reservation code: " + reservation.getReservationCode() + "\n"
                + "Storage unit: " + reservation.getUnitCode() + "\n"
                + "Contract status: " + contract.getStatus() + "\n"
                + "Gate PIN: " + gatePin + "\n\n"
                + "Thank you for using Smart Storage.";

        try {
            emailService.sendTextEmail(
                    account.getEmail(),
                    "Smart Storage - Check-in completed",
                    content
            );
        } catch (Exception exception) {
            log.warn("Check-in completed but confirmation email could not be sent to {}: {}",
                    account.getEmail(), exception.getMessage());
        }
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
