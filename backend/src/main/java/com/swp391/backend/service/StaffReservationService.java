package com.swp391.backend.service;

import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.StaffCancelReservationResponse;
import com.swp391.backend.dto.StaffChangeUnitResponse;
import com.swp391.backend.dto.StaffReservationListItemResponse;
import com.swp391.backend.dto.StaffReservationListResponse;
import com.swp391.backend.dto.StaffReservationLookupResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.CustomerProfile;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.CustomerProfileRepository;
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
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class StaffReservationService {

    private static final String CONTRACT_PENDING_CHECKIN = "PENDING_CHECKIN";
    private static final String CONTRACT_ACTIVE = "ACTIVE";
    private static final String RESERVATION_PENDING = "PENDING";
    private static final String RESERVATION_CONFIRMED = "CONFIRMED";

    private final ReservationRepository reservationRepository;
    private final AccountRepository accountRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final CustomerProfileRepository customerProfileRepository;
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
            CustomerProfileRepository customerProfileRepository,
            FloorRepository floorRepository,
            ActivityLogRepository activityLogRepository,
            StorageService storageService) {
        this.reservationRepository = reservationRepository;
        this.accountRepository = accountRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.floorRepository = floorRepository;
        this.activityLogRepository = activityLogRepository;
        this.storageService = storageService;
    }

    public StaffReservationListResponse listReservations() {
        Integer accountId = getAuthenticatedAccountId();
        if (accountId == null) {
            return new StaffReservationListResponse(false, "Không tìm thấy tài khoản nhân viên đã xác thực.",
                    List.of());
        }
        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(accountId);
        if (employee.isEmpty()) {
            return new StaffReservationListResponse(false, "Không tìm thấy hồ sơ nhân viên.", List.of());
        }

        List<StaffReservationListItemResponse> reservations = reservationRepository
                .findByFacilityId(employee.get().getFacilityId()).stream()
                .map(this::toListItem)
                .sorted(Comparator
                        .comparing((StaffReservationListItemResponse item) -> !CONTRACT_PENDING_CHECKIN
                                .equals(item.getContractStatus()))
                        .thenComparing(StaffReservationListItemResponse::getCheckInDate,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        return new StaffReservationListResponse(true, "Đã tải danh sách đặt chỗ.", reservations);
    }

    public StaffReservationLookupResponse lookupReservation(String reservationCode) {
        StaffReservationLookupResponse response = new StaffReservationLookupResponse();
        if (reservationCode == null || reservationCode.isBlank()) {
            response.setSuccess(false);
            response.setMessage("Mã đặt chỗ là bắt buộc.");
            return response;
        }

        Integer accountId = getAuthenticatedAccountId();
        if (accountId == null) {
            response.setSuccess(false);
            response.setMessage("Không tìm thấy tài khoản nhân viên đã xác thực.");
            return response;
        }
        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(accountId);
        if (employee.isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Không tìm thấy hồ sơ nhân viên.");
            return response;
        }

        Optional<Reservation> reservation = reservationRepository.findByReservationCode(reservationCode.trim());
        if (reservation.isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Không tìm thấy đặt chỗ.");
            return response;
        }
        Optional<StorageUnit> unit = storageUnitRepository.findById(reservation.get().getUnitCode());
        if (unit.isEmpty() || !belongsToFacility(unit.get(), employee.get().getFacilityId())) {
            response.setSuccess(false);
            response.setMessage("Không tìm thấy đặt chỗ trong cơ sở của nhân viên.");
            return response;
        }

        StaffReservationListItemResponse item = toListItem(reservation.get());
        copyListItem(item, response);
        response.setUnitStatus(unit.get().getStatus());
        contractRepository.findByReservationId(reservation.get().getReservationId())
                .ifPresent(contract -> response.setContractPdfUrl(contract.getPdfUrl()));
        response.setSuccess(true);
        response.setMessage("Đã tìm thấy đặt chỗ.");
        return response;
    }

    @Transactional
    public StaffChangeUnitResponse changeUnit(Integer reservationId, String newUnitCode) {
        Integer staffAccountId = getAuthenticatedAccountId();
        if (staffAccountId == null) {
            return changeUnitFailure("Không tìm thấy tài khoản nhân viên đã xác thực trong SecurityContext.");
        }

        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(staffAccountId);
        if (employee.isEmpty()) {
            return changeUnitFailure("Không tìm thấy hồ sơ nhân viên của tài khoản đã xác thực.");
        }
        Integer staffFacilityId = employee.get().getFacilityId();

        Optional<Reservation> reservationOpt = reservationRepository.findByReservationIdForUpdate(reservationId);
        if (reservationOpt.isEmpty()) {
            return changeUnitFailure("Không tìm thấy đặt chỗ.");
        }
        Reservation reservation = reservationOpt.get();
        if (!isChangeableReservation(reservation)) {
            return changeUnitFailure("Đặt chỗ không ở trạng thái có thể thay đổi.");
        }

        Optional<Contract> contractOpt = contractRepository.findByReservationId(reservation.getReservationId());
        if (contractOpt.isEmpty() || !CONTRACT_PENDING_CHECKIN.equals(contractOpt.get().getStatus())) {
            return changeUnitFailure("Cần có hợp đồng PENDING_CHECKIN để thay đổi kho.");
        }
        Contract contract = contractOpt.get();

        String oldUnitCode = reservation.getUnitCode();
        if (newUnitCode == null || newUnitCode.isBlank()) {
            return changeUnitFailure("Mã kho mới là bắt buộc.");
        }
        newUnitCode = newUnitCode.trim();
        if (oldUnitCode.equals(newUnitCode)) {
            return changeUnitFailure("Kho mới phải khác kho hiện tại.");
        }

        LockedUnits lockedUnits = lockUnitsInStableOrder(oldUnitCode, newUnitCode);
        if (lockedUnits.oldUnit().isEmpty()) {
            return changeUnitFailure("Không tìm thấy kho hiện tại.");
        }
        if (lockedUnits.newUnit().isEmpty()) {
            return changeUnitFailure("Không tìm thấy kho mới.");
        }
        StorageUnit oldUnit = lockedUnits.oldUnit().get();
        StorageUnit newUnit = lockedUnits.newUnit().get();

        if (!belongsToFacility(oldUnit, staffFacilityId) || !belongsToFacility(newUnit, staffFacilityId)) {
            return changeUnitFailure("Cả hai kho phải thuộc cơ sở của nhân viên.");
        }
        if (!"RESERVED".equals(oldUnit.getStatus())) {
            return changeUnitFailure("Kho hiện tại phải ở trạng thái RESERVED.");
        }
        if (!"AVAILABLE".equals(newUnit.getStatus())) {
            return changeUnitFailure("Kho mới phải ở trạng thái AVAILABLE.");
        }

        List<Payment> depositInvoices = findDepositInvoices(contract.getContractId());
        if (depositInvoices.size() != 1) {
            return changeUnitFailure("Cần chính xác một hóa đơn DEP hoặc INITIAL_RENTAL cũ để tính lại tiền đặt cọc.");
        }
        Payment depositInvoice = depositInvoices.get(0);

        int duration = (int) Math.max(1L,
                ChronoUnit.DAYS.between(reservation.getStartDate(), reservation.getEndDate()));
        CalculatePriceResponse newPrice = storageService.calculateRentalPrice(
                new CalculatePriceRequest(newUnit.getUnitTypeId(), reservation.getRentalType(), duration));
        if (!newPrice.isSuccess()) {
            return changeUnitFailure("Không thể tính giá kho mới: " + newPrice.getMessage());
        }

        BigDecimal totalNew = zeroIfNull(newPrice.getFinalRentalAmount()).add(zeroIfNull(newPrice.getDepositAmount()));
        BigDecimal paid = getActualPaidAmount(depositInvoice);
        BigDecimal remaining = totalNew.subtract(paid);

        depositInvoice.setAmount(totalNew);
        depositInvoice.setPaidAmount(paid);
        depositInvoice.setRemainingAmount(remaining.max(BigDecimal.ZERO));
        depositInvoice.setStatus(remaining.signum() <= 0
                ? "PAID"
                : (paid.signum() > 0 ? "PARTIALLY_PAID" : "PENDING"));
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
                ? "còn phải thanh toán tại quầy=" + remaining
                : "yêu cầu hoàn tiền=" + refundAmount;
        writeActivityLog(staffAccountId, "STAFF_CHANGE_UNIT",
                "RES " + reservation.getReservationId() + ": kho cũ " + oldUnitCode
                        + " -> kho mới " + newUnit.getUnitCode() + "; " + result + "; kết quả=SUCCESS");

        return new StaffChangeUnitResponse(true, "Đã thay đổi kho. " + result + ".",
                reservationId, newUnit.getUnitCode(), remaining.max(BigDecimal.ZERO), refundAmount);
    }

    @Transactional
    public StaffCancelReservationResponse cancelReservation(Integer reservationId) {
        Integer staffAccountId = getAuthenticatedAccountId();
        if (staffAccountId == null) {
            return cancelReservationFailure("Không tìm thấy tài khoản nhân viên đã xác thực trong SecurityContext.");
        }

        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(staffAccountId);
        if (employee.isEmpty()) {
            return cancelReservationFailure("Không tìm thấy hồ sơ nhân viên của tài khoản đã xác thực.");
        }
        Integer staffFacilityId = employee.get().getFacilityId();

        Optional<Reservation> reservationOpt = reservationRepository.findByReservationIdForUpdate(reservationId);
        if (reservationOpt.isEmpty()) {
            return cancelReservationFailure("Không tìm thấy đặt chỗ.");
        }
        Reservation reservation = reservationOpt.get();
        if (!isChangeableReservation(reservation)) {
            return cancelReservationFailure("Đặt chỗ không ở trạng thái có thể hủy.");
        }

        Optional<Contract> contractOpt = contractRepository.findByReservationId(reservation.getReservationId());
        if (contractOpt.isEmpty() || !CONTRACT_PENDING_CHECKIN.equals(contractOpt.get().getStatus())) {
            return cancelReservationFailure("Cần có hợp đồng PENDING_CHECKIN để hủy đặt chỗ.");
        }
        Contract contract = contractOpt.get();

        Optional<StorageUnit> unitOpt = storageUnitRepository.findByUnitCodeForUpdate(reservation.getUnitCode());
        if (unitOpt.isEmpty()) {
            return cancelReservationFailure("Không tìm thấy kho của đặt chỗ.");
        }
        StorageUnit unit = unitOpt.get();
        if (!belongsToFacility(unit, staffFacilityId)) {
            return cancelReservationFailure("Kho của đặt chỗ không thuộc cơ sở của nhân viên.");
        }
        if (!"RESERVED".equals(unit.getStatus())) {
            return cancelReservationFailure("Kho của đặt chỗ phải ở trạng thái RESERVED để được giải phóng.");
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
        contract.setCancelReason("COUNTER_CANCEL");
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
                "RES " + reservation.getReservationId() + ": số tiền hoàn=" + refundAmount
                        + "; tiền phạt=" + penaltyAmount + "; kết quả=SUCCESS");

        return new StaffCancelReservationResponse(true,
                "Đã hủy đặt chỗ. Yêu cầu hoàn tiền=" + refundAmount + ", tiền phạt=" + penaltyAmount + ".",
                reservationId, reservation.getReservationCode(), refundAmount, penaltyAmount);
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
        refund.setInvoiceNumber(
                "REF-" + contractId + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20));
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
        item.setCheckInDate(LocalDate.now());
        item.setReservationStartDate(reservation.getStartDate());
        item.setReservationEndDate(reservation.getEndDate());
        item.setRentalDuration(calculateRentalDuration(reservation.getStartDate(), reservation.getEndDate()));
        accountRepository.findAccountByAccountId(reservation.getAccountId()).ifPresent(account -> {
            item.setCustomerName(account.getFullName());
            item.setCustomerPhone(account.getPhone());
            item.setCustomerEmail(account.getEmail());
        });
        customerProfileRepository.findByAccountId(reservation.getAccountId()).ifPresent(customer -> {
            item.setCustomerIdNumber(customer.getIdentityNumber());
        });

        storageUnitRepository.findById(reservation.getUnitCode()).ifPresent(unit -> {
            item.setUnitCode(unit.getUnitCode());
            floorRepository.findById(unit.getFloorId()).ifPresent(floor -> item.setFloorName(floor.getFloorName()));
        });

        item.setDepositAmount(reservation.getDepositAmount());
        item.setRentalAmount(reservation.getRentalAmount());
        BigDecimal defDep = reservation.getDepositAmount() != null ? reservation.getDepositAmount() : BigDecimal.ZERO;
        BigDecimal defRent = reservation.getRentalAmount() != null ? reservation.getRentalAmount() : BigDecimal.ZERO;
        BigDecimal defTotal = defDep.add(defRent);
        item.setDepAmount(defTotal);
        item.setDepPaidAmount(defDep);
        item.setDepRemainingAmount(defRent);

        contractRepository.findByReservationId(reservation.getReservationId()).ifPresent(contract -> {
            item.setContractStatus(contract.getStatus());
            paymentRepository.findByContractId(contract.getContractId()).stream()
                    .filter(payment -> "DEP".equalsIgnoreCase(payment.getInvoiceType())
                            || "INITIAL_RENTAL".equalsIgnoreCase(payment.getInvoiceType()))
                    .max(Comparator.comparing(Payment::getPaymentId))
                    .ifPresent(payment -> {
                        BigDecimal totalAmt = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
                        BigDecimal depAmt = reservation.getDepositAmount() != null ? reservation.getDepositAmount() : BigDecimal.ZERO;
                        BigDecimal rentalAmt = reservation.getRentalAmount() != null ? reservation.getRentalAmount() : BigDecimal.ZERO;
                        BigDecimal paid = payment.getPaidAmount() != null ? payment.getPaidAmount() : BigDecimal.ZERO;

                        // Hợp đồng đã chuyển sang trang staff (PENDING_CHECKIN) thì 100% đã cọc đủ
                        if (paid.compareTo(depAmt) < 0 && CONTRACT_PENDING_CHECKIN.equals(contract.getStatus())) {
                            paid = depAmt;
                        }
                        if (CONTRACT_ACTIVE.equals(contract.getStatus())) {
                            if (totalAmt.compareTo(BigDecimal.ZERO) == 0) {
                                totalAmt = depAmt.add(rentalAmt);
                            }
                            paid = totalAmt;
                        }
                        if (totalAmt.compareTo(BigDecimal.ZERO) == 0 && (depAmt.compareTo(BigDecimal.ZERO) > 0 || rentalAmt.compareTo(BigDecimal.ZERO) > 0)) {
                            totalAmt = depAmt.add(rentalAmt);
                        }
                        BigDecimal remaining = totalAmt.subtract(paid);
                        if (remaining.signum() < 0) remaining = BigDecimal.ZERO;

                        item.setDepStatus(remaining.signum() == 0 ? "PAID" : "PARTIALLY_PAID");
                        item.setDepPaymentStatus("SUCCESS");
                        item.setDepAmount(totalAmt);
                        item.setDepPaidAmount(paid);
                        item.setDepRemainingAmount(remaining);
                    });
        });
        return item;
    }

    private void copyListItem(StaffReservationListItemResponse source,
            StaffReservationLookupResponse target) {
        target.setReservationId(source.getReservationId());
        target.setReservationCode(source.getReservationCode());
        target.setCustomerName(source.getCustomerName());
        target.setCustomerIdNumber(source.getCustomerIdNumber());
        target.setCustomerEmail(source.getCustomerEmail());
        target.setCustomerPhone(source.getCustomerPhone());
        target.setUnitCode(source.getUnitCode());
        target.setFloorName(source.getFloorName());
        target.setReservationStatus(source.getReservationStatus());
        target.setCheckInDate(source.getCheckInDate());
        target.setContractStatus(source.getContractStatus());
        target.setReservationStartDate(source.getReservationStartDate());
        target.setReservationEndDate(source.getReservationEndDate());
        target.setRentalDuration(source.getRentalDuration());
        target.setDepositAmount(source.getDepositAmount());
        target.setRentalAmount(source.getRentalAmount());
        target.setDepStatus(source.getDepStatus());
        target.setDepPaymentStatus(source.getDepPaymentStatus());
        target.setDepAmount(source.getDepAmount());
        target.setDepPaidAmount(source.getDepPaidAmount());
        target.setDepRemainingAmount(source.getDepRemainingAmount());
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

    private StaffChangeUnitResponse changeUnitFailure(String message) {
        return new StaffChangeUnitResponse(false, message, null, null, null, null);
    }

    private StaffCancelReservationResponse cancelReservationFailure(String message) {
        return new StaffCancelReservationResponse(false, message, null, null, null, null);
    }

    private record LockedUnits(Optional<StorageUnit> oldUnit, Optional<StorageUnit> newUnit) {
    }

    private String calculateRentalDuration(
            LocalDate startDate,
            LocalDate endDate) {

        Period period = Period.between(startDate, endDate);

        if (period.toTotalMonths() < 1) {
            long days = ChronoUnit.DAYS.between(startDate, endDate);
            return days + " ngày";
        }

        long months = period.toTotalMonths();
        long days = period.getDays();

        if (days == 0) {
            return months + " tháng";
        }

        return months + " tháng " + days + " ngày";
    }
}
