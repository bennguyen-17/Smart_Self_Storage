package com.swp391.backend.service;

import com.swp391.backend.dto.ApiResponse;
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
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.CustomerProfileRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import com.swp391.backend.repository.SupportTicketRepository;
import com.swp391.backend.dto.CollectPenaltyRequest;
import com.swp391.backend.dto.CollectPenaltyResponse;
import com.swp391.backend.dto.GatePinResult;
import com.swp391.backend.dto.RenewAtCounterRequest;
import com.swp391.backend.dto.RenewAtCounterResponse;
import com.swp391.backend.dto.StaffGatePinResponse;
import com.swp391.backend.entity.Facility;
import com.swp391.backend.entity.GatePin;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.GatePinRepository;
import com.swp391.backend.entity.Price;
import com.swp391.backend.repository.PriceRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
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
import java.util.Random;
import java.util.UUID;

@Service
public class StaffReservationService {

    private static final String CONTRACT_PENDING_CHECKIN = "PENDING_CHECKIN";
    private static final String CONTRACT_ACTIVE = "ACTIVE";
    private static final String CONTRACT_OVERDUE = "OVERDUE";
    private static final String RESERVATION_PENDING = "PENDING";
    private static final String RESERVATION_CONFIRMED = "CONFIRMED";
    private static final BigDecimal DAILY_OVERDUE_FEE = new BigDecimal("50000.00");
    private static final int MAX_CHARGEABLE_OVERDUE_DAYS = 29;

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
    private final SupportTicketRepository supportTicketRepository;
    private final PriceRepository priceRepository;
    private final GatePinService gatePinService;
    private final FacilityRepository facilityRepository;
    private final GatePinRepository gatePinRepository;
    private final StaffShiftService staffShiftService;

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
            StorageService storageService,
            SupportTicketRepository supportTicketRepository,
            PriceRepository priceRepository,
            GatePinService gatePinService,
            FacilityRepository facilityRepository,
            GatePinRepository gatePinRepository,
            StaffShiftService staffShiftService) {
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
        this.supportTicketRepository = supportTicketRepository;
        this.priceRepository = priceRepository;
        this.gatePinService = gatePinService;
        this.facilityRepository = facilityRepository;
        this.gatePinRepository = gatePinRepository;
        this.staffShiftService = staffShiftService;
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
        try {
            staffShiftService.requireOnDutyFacility(accountId);
        } catch (AccessDeniedException ex) {
            return new StaffReservationListResponse(false, ex.getMessage(), List.of());
        }

        List<StaffReservationListItemResponse> reservations = reservationRepository
                .findByFacilityId(employee.get().getFacilityId()).stream()
                .map(this::toListItem)
                .filter(item -> item.getContractStatus() != null &&
                        List.of(CONTRACT_PENDING_CHECKIN, CONTRACT_ACTIVE, CONTRACT_OVERDUE).contains(item.getContractStatus()))
                .sorted(Comparator
                        .comparing((StaffReservationListItemResponse item) -> {
                            if (CONTRACT_PENDING_CHECKIN.equals(item.getContractStatus())) return 0;
                            if (CONTRACT_ACTIVE.equals(item.getContractStatus())) return 1;
                            if (CONTRACT_OVERDUE.equals(item.getContractStatus())) return 2;
                            return 3;
                        })
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
        try {
            staffShiftService.requireOnDutyFacility(accountId);
        } catch (AccessDeniedException ex) {
            response.setSuccess(false);
            response.setMessage(ex.getMessage());
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

        long days = 30;
        if (reservation.getStartDate() != null && reservation.getEndDate() != null) {
            days = Math.max(1, ChronoUnit.DAYS.between(reservation.getStartDate(), reservation.getEndDate()));
        }
        String rentalType = (days < 30) ? "DAILY" : "MONTHLY";
        int duration = (int) (days < 30 ? days : Math.max(1, Math.round((double) days / 30.0)));

        CalculatePriceResponse newPrice = storageService.calculateRentalPrice(
                new CalculatePriceRequest(newUnit.getUnitTypeId(), rentalType, duration));
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
            BigDecimal refundRate = new BigDecimal("0.50"); // BR-20: Hủy tại quầy giữ 50% cọc, hoàn 50%
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
        Contract c = contractRepository.findById(contractId).orElse(null);
        String cCode = "CTR-" + contractId;
        if (c != null) {
            Reservation r = reservationRepository.findById(c.getReservationId()).orElse(null);
            if (r != null && r.getReservationCode() != null && !r.getReservationCode().isBlank()) {
                cCode = r.getReservationCode();
            }
        }
        Payment refund = new Payment();
        refund.setContractId(contractId);
        refund.setInvoiceNumber("REF-" + cCode);
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
        writeActivityLog(accountId, action, description, null);
    }

    private void writeActivityLog(Integer accountId, String action, String description, Integer facilityId) {
        ActivityLog log = new ActivityLog();
        log.setAccountId(accountId);
        log.setFacilityId(facilityId);
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
            item.setContractId(contract.getContractId());
            item.setContractStatus(contract.getStatus());
            Optional<SupportTicket> earlyTicket = supportTicketRepository.findByContractId(contract.getContractId()).stream()
                    .filter(t -> "EARLY_TERMINATION".equalsIgnoreCase(t.getType()) && !"RESOLVED".equalsIgnoreCase(t.getStatus()))
                    .findFirst();
            if (earlyTicket.isPresent()) {
                item.setReturnRequested(true);
                item.setDesiredReturnDate(earlyTicket.get().getDesiredDate());
            } else if ("EARLY_TERMINATION".equalsIgnoreCase(contract.getCancelReason())) {
                item.setReturnRequested(true);
            }
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

        // 1. Tính giá thuê tháng (monthlyPrice) cho ô kho
        BigDecimal monthlyPrice = BigDecimal.ZERO;
        if (reservation.getUnitCode() != null) {
            Optional<StorageUnit> uOpt = storageUnitRepository.findById(reservation.getUnitCode());
            if (uOpt.isPresent()) {
                Optional<Price> pOpt = priceRepository.findByUnitTypeIdAndStatus(uOpt.get().getUnitTypeId(), "ACTIVE");
                if (pOpt.isPresent() && pOpt.get().getMonthlyPrice() != null) {
                    monthlyPrice = pOpt.get().getMonthlyPrice();
                }
            }
        }
        if (monthlyPrice.compareTo(BigDecimal.ZERO) == 0 && reservation.getRentalAmount() != null) {
            monthlyPrice = reservation.getRentalAmount();
        }
        item.setMonthlyPrice(monthlyPrice);

        // 2. Tính số ngày quá hạn (overdueDays)
        LocalDate today = LocalDate.now();
        LocalDate endDate = reservation.getEndDate();
        int overdueDays = 0;
        if (endDate != null && endDate.isBefore(today)) {
            overdueDays = (int) Math.min(
                    ChronoUnit.DAYS.between(endDate, today), MAX_CHARGEABLE_OVERDUE_DAYS);
        }
        item.setOverdueDays(overdueDays);

        // 3. Tính tiền phạt quá hạn: Chuẩn 50.000 VNĐ / ngày quá hạn
        BigDecimal expectedPenalty = DAILY_OVERDUE_FEE.multiply(BigDecimal.valueOf(overdueDays));
        BigDecimal paidPenalty = BigDecimal.ZERO;

        if (item.getContractId() != null) {
            List<Payment> penPayments = paymentRepository.findByContractId(item.getContractId()).stream()
                    .filter(p -> "OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType())
                            || (p.getInvoiceNumber() != null && (p.getInvoiceNumber().startsWith("PEN-") || p.getInvoiceNumber().startsWith("OVD-"))))
                    .toList();
            for (Payment p : penPayments) {
                if ("PAID".equalsIgnoreCase(p.getStatus()) && "SUCCESS".equalsIgnoreCase(p.getPaymentStatus())) {
                    BigDecimal paid = p.getPaidAmount() != null ? p.getPaidAmount() : (p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                    paidPenalty = paidPenalty.add(paid);
                }
            }
        }
        BigDecimal unpaidPenalty = expectedPenalty.subtract(paidPenalty);
        if (unpaidPenalty.compareTo(BigDecimal.ZERO) < 0) {
            unpaidPenalty = BigDecimal.ZERO;
        }
        item.setUnpaidPenaltyAmount(unpaidPenalty);

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
        target.setOverdueDays(source.getOverdueDays());
        target.setUnpaidPenaltyAmount(source.getUnpaidPenaltyAmount());
        target.setMonthlyPrice(source.getMonthlyPrice());
        target.setDesiredReturnDate(source.getDesiredReturnDate());
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

    @Transactional
    public CollectPenaltyResponse collectPenalty(Integer reservationId, CollectPenaltyRequest request) {
        Integer staffAccountId = getAuthenticatedAccountId();
        if (staffAccountId == null) {
            return new CollectPenaltyResponse(false, "Không tìm thấy tài khoản nhân viên đã xác thực.");
        }
        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(staffAccountId);
        if (employee.isEmpty()) {
            return new CollectPenaltyResponse(false, "Không tìm thấy hồ sơ nhân viên.");
        }

        Optional<Reservation> resOpt = reservationRepository.findById(reservationId);
        if (resOpt.isEmpty()) {
            return new CollectPenaltyResponse(false, "Không tìm thấy đơn đặt chỗ.");
        }
        Reservation reservation = resOpt.get();

        Optional<StorageUnit> unitOpt = storageUnitRepository.findById(reservation.getUnitCode());
        if (unitOpt.isEmpty() || !belongsToFacility(unitOpt.get(), employee.get().getFacilityId())) {
            return new CollectPenaltyResponse(false, "Đặt chỗ không thuộc cơ sở của nhân viên.");
        }

        Optional<Contract> contractOpt = contractRepository.findByReservationId(reservationId);
        if (contractOpt.isEmpty()) {
            return new CollectPenaltyResponse(false, "Không tìm thấy hợp đồng của đặt chỗ này.");
        }
        Contract contract = contractOpt.get();

        if (!CONTRACT_OVERDUE.equalsIgnoreCase(contract.getStatus())) {
            return new CollectPenaltyResponse(false, "Chỉ thu phạt cho hợp đồng OVERDUE.");
        }

        String requestedMethod = request != null && request.getPaymentMethod() != null
                ? request.getPaymentMethod().trim().toUpperCase(java.util.Locale.ROOT)
                : "";
        String paymentMethod = switch (requestedMethod) {
            case "CASH", "" -> "CASH";
            case "TRANSFER", "BANK_TRANSFER" -> "BANK_TRANSFER";
            case "VIETQR" -> "VIETQR";
            default -> null;
        };
        if (paymentMethod == null) {
            return new CollectPenaltyResponse(false,
                    "Phương thức thanh toán phải là CASH, BANK_TRANSFER hoặc VIETQR.");
        }

        LocalDate today = LocalDate.now();
        LocalDate endDate = reservation.getEndDate();
        int overdueDays = (endDate != null && endDate.isBefore(today))
                ? (int) Math.min(
                        ChronoUnit.DAYS.between(endDate, today), MAX_CHARGEABLE_OVERDUE_DAYS)
                : 0;

        BigDecimal totalExpected = DAILY_OVERDUE_FEE.multiply(BigDecimal.valueOf(overdueDays));
        List<Payment> penPayments = paymentRepository.findByContractId(contract.getContractId()).stream()
                .filter(p -> "OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType())
                        || (p.getInvoiceNumber() != null && (p.getInvoiceNumber().startsWith("PEN-") || p.getInvoiceNumber().startsWith("OVD-"))))
                .toList();

        String invoiceNumber = "PEN-" + (reservation.getReservationCode() != null ? reservation.getReservationCode() : ("CTR-" + contract.getContractId()));
        Payment penaltyInvoice = penPayments.stream()
                .filter(p -> invoiceNumber.equals(p.getInvoiceNumber()))
                .findFirst()
                .orElse(null);

        BigDecimal alreadyPaid = penaltyInvoice == null ? BigDecimal.ZERO : zeroIfNull(penaltyInvoice.getPaidAmount());
        BigDecimal collectedAmount = totalExpected.subtract(alreadyPaid).max(BigDecimal.ZERO);

        if (collectedAmount.signum() <= 0) {
            return new CollectPenaltyResponse(false, "Hợp đồng không có khoản phạt chưa thanh toán.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (penaltyInvoice == null) {
            penaltyInvoice = new Payment();
            penaltyInvoice.setContractId(contract.getContractId());
            penaltyInvoice.setInvoiceNumber(invoiceNumber);
            penaltyInvoice.setInvoiceType("OVERDUE_FEE");
            penaltyInvoice.setIssuedAt(now);
            penaltyInvoice.setDueAt(now);
        }
        penaltyInvoice.setAmount(totalExpected);
        penaltyInvoice.setPaidAmount(alreadyPaid.add(collectedAmount));
        penaltyInvoice.setRemainingAmount(BigDecimal.ZERO);
        penaltyInvoice.setStatus("PAID");
        penaltyInvoice.setPaymentStatus("SUCCESS");
        penaltyInvoice.setPaymentMethod(paymentMethod);
        penaltyInvoice.setTransactionCode("COUNTER_PEN_" + System.currentTimeMillis());
        penaltyInvoice.setPaidAt(now);
        paymentRepository.save(penaltyInvoice);

        writeActivityLog(staffAccountId, "COLLECT_PENALTY_AT_COUNTER",
                "Thu phạt quá hạn tại quầy bằng " + paymentMethod + " cho hợp đồng " + (reservation.getReservationCode() != null ? reservation.getReservationCode() : contract.getContractId()) + ", số tiền: " + collectedAmount + " VND (" + overdueDays + " ngày quá hạn, đơn giá 50.000đ/ngày)",
                unitOpt.map(StorageUnit::getFloorId).flatMap(floorRepository::findById).map(Floor::getFacilityId).orElse(null));

        CollectPenaltyResponse resp = new CollectPenaltyResponse();
        resp.setSuccess(true);
        resp.setMessage("Đã thu phạt quá hạn tại quầy thành công.");
        resp.setReservationId(reservation.getReservationId());
        resp.setReservationCode(reservation.getReservationCode());
        resp.setContractStatus(contract.getStatus());
        resp.setUnitStatus(unitOpt.map(StorageUnit::getStatus).orElse(null));
        resp.setInvoiceNumber(invoiceNumber);
        resp.setCollectedAmount(collectedAmount);
        resp.setOverdueDays(overdueDays);
        return resp;
    }

    @Transactional
    public RenewAtCounterResponse renewAtCounter(Integer reservationId, RenewAtCounterRequest request) {
        Integer staffAccountId = getAuthenticatedAccountId();
        if (staffAccountId == null) {
            return new RenewAtCounterResponse(false, "Không tìm thấy tài khoản nhân viên đã xác thực.");
        }
        Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(staffAccountId);
        if (employee.isEmpty()) {
            return new RenewAtCounterResponse(false, "Không tìm thấy hồ sơ nhân viên.");
        }

        Optional<Reservation> resOpt = reservationRepository.findById(reservationId);
        if (resOpt.isEmpty()) {
            return new RenewAtCounterResponse(false, "Không tìm thấy đơn đặt chỗ.");
        }
        Reservation reservation = resOpt.get();

        Optional<StorageUnit> unitOpt = storageUnitRepository.findById(reservation.getUnitCode());
        if (unitOpt.isEmpty() || !belongsToFacility(unitOpt.get(), employee.get().getFacilityId())) {
            return new RenewAtCounterResponse(false, "Đặt chỗ không thuộc cơ sở của nhân viên.");
        }

        Optional<Contract> contractOpt = contractRepository.findByReservationId(reservationId);
        if (contractOpt.isEmpty()) {
            return new RenewAtCounterResponse(false, "Không tìm thấy hợp đồng của đặt chỗ này.");
        }
        Contract contract = contractOpt.get();

        // 1. Kiểm tra phạt quá hạn chưa nộp (tính chuẩn 50.000đ/ngày quá hạn)
        LocalDate today = LocalDate.now();
        LocalDate endDate = reservation.getEndDate();
        int overdueDays = (endDate != null && endDate.isBefore(today))
                ? (int) Math.min(
                        ChronoUnit.DAYS.between(endDate, today), MAX_CHARGEABLE_OVERDUE_DAYS)
                : 0;
        BigDecimal expectedPenalty = DAILY_OVERDUE_FEE.multiply(BigDecimal.valueOf(overdueDays));

        List<Payment> penPayments = paymentRepository.findByContractId(contract.getContractId()).stream()
                .filter(p -> "OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType())
                        || (p.getInvoiceNumber() != null && (p.getInvoiceNumber().startsWith("PEN-") || p.getInvoiceNumber().startsWith("OVD-"))))
                .toList();

        BigDecimal paidPenalty = BigDecimal.ZERO;
        for (Payment p : penPayments) {
            if ("PAID".equalsIgnoreCase(p.getStatus()) && "SUCCESS".equalsIgnoreCase(p.getPaymentStatus())) {
                BigDecimal paid = p.getPaidAmount() != null ? p.getPaidAmount() : (p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                paidPenalty = paidPenalty.add(paid);
            }
        }

        BigDecimal unpaidPenalty = expectedPenalty.subtract(paidPenalty).max(BigDecimal.ZERO);
        if (unpaidPenalty.compareTo(BigDecimal.ZERO) > 0) {
            return new RenewAtCounterResponse(false, "Còn tiền phạt quá hạn chưa nộp (50.000đ/ngày). Vui lòng thu phạt trước khi gia hạn.");
        }

        // 2. Lấy giá thuê tháng (monthlyPrice)
        BigDecimal monthlyPrice = BigDecimal.ZERO;
        if (unitOpt.isPresent()) {
            Optional<Price> pOpt = priceRepository.findByUnitTypeIdAndStatus(unitOpt.get().getUnitTypeId(), "ACTIVE");
            if (pOpt.isPresent() && pOpt.get().getMonthlyPrice() != null) {
                monthlyPrice = pOpt.get().getMonthlyPrice();
            }
        }
        if (monthlyPrice.compareTo(BigDecimal.ZERO) == 0 && reservation.getRentalAmount() != null) {
            monthlyPrice = reservation.getRentalAmount();
        }

        // 3. Thời gian gia hạn: Hỗ trợ cả gói tháng và số ngày tùy chọn
        boolean isCustomDays = (request != null && request.getDays() != null && request.getDays() > 0);
        int addedDays;
        int discountPercent = 0;
        BigDecimal finalAmount;
        int months = (request != null && request.getMonths() != null && request.getMonths() > 0)
                ? request.getMonths()
                : 1;

        if (isCustomDays) {
            addedDays = request.getDays();
            // Đơn giá ngày = monthlyPrice / 30
            BigDecimal dailyPrice = monthlyPrice.divide(BigDecimal.valueOf(30), 2, java.math.RoundingMode.HALF_UP);
            finalAmount = dailyPrice.multiply(BigDecimal.valueOf(addedDays)).setScale(0, java.math.RoundingMode.HALF_UP);
        } else {
            addedDays = months * 30;
            // Chiết khấu: 12 tháng -> 15%, 6 tháng -> 10%, 3 tháng -> 5%, khác -> 0%
            if (months >= 12) discountPercent = 15;
            else if (months >= 6) discountPercent = 10;
            else if (months >= 3) discountPercent = 5;

            BigDecimal rawTotal = monthlyPrice.multiply(BigDecimal.valueOf(months));
            BigDecimal discountFactor = BigDecimal.valueOf(100 - discountPercent).divide(BigDecimal.valueOf(100));
            finalAmount = rawTotal.multiply(discountFactor).setScale(0, java.math.RoundingMode.HALF_UP);
        }

        // 4. Cập nhật ngày kết thúc của Reservation
        LocalDate currentExpiry = reservation.getEndDate() != null ? reservation.getEndDate() : LocalDate.now();
        if (currentExpiry.isBefore(LocalDate.now())) {
            currentExpiry = LocalDate.now();
        }
        LocalDate newExpiry = currentExpiry.plusDays(addedDays);
        reservation.setEndDate(newExpiry);
        reservationRepository.save(reservation);

        // 6. Cập nhật trạng thái hợp đồng về ACTIVE
        contract.setStatus("ACTIVE");
        contractRepository.save(contract);

        // 7. Tạo hóa đơn gia hạn EXT-... thanh toán bằng tiền mặt (CASH)
        LocalDateTime now = LocalDateTime.now();
        String dateStr = now.format(java.time.format.DateTimeFormatter.ofPattern("ddMMyy"));
        String invoiceNumber = "EXT-" + (reservation.getReservationCode() != null ? reservation.getReservationCode() : ("CTR-" + contract.getContractId()))
                + "-" + dateStr + "-" + String.format("%04d", new Random().nextInt(10000));

        Payment extPayment = new Payment();
        extPayment.setContractId(contract.getContractId());
        extPayment.setInvoiceNumber(invoiceNumber);
        extPayment.setInvoiceType("MONTHLY_RENEWAL");
        extPayment.setAmount(finalAmount);
        extPayment.setPaidAmount(finalAmount);
        extPayment.setRemainingAmount(BigDecimal.ZERO);
        extPayment.setIssuedAt(now);
        extPayment.setDueAt(now.plusDays(1));
        extPayment.setStatus("PAID");
        extPayment.setPaymentMethod("CASH"); // Bắt buộc Tiền mặt tại quầy
        extPayment.setPaymentStatus("SUCCESS");
        extPayment.setTransactionCode("CASH_EXT_" + System.currentTimeMillis());
        extPayment.setPaidAt(now);
        paymentRepository.save(extPayment);

        // 8. Cấp/khôi phục Gate PIN cho khách
        String gatePinCode = null;
        try {
            GatePinResult pinResult = gatePinService.generatePin(contract);
            gatePinCode = pinResult.getPin();
        } catch (Exception ignored) {}

        writeActivityLog(staffAccountId, "RENEW_AT_COUNTER",
                "Gia hạn hợp đồng tại quầy bằng tiền mặt (CASH) cho đơn " + reservation.getReservationCode() + ", thời hạn " + (isCustomDays ? (addedDays + " ngày") : (months + " tháng")) + ", số tiền: " + finalAmount + " VND, hạn mới: " + newExpiry);

        RenewAtCounterResponse resp = new RenewAtCounterResponse();
        resp.setSuccess(true);
        resp.setMessage("Gia hạn tại quầy thành công.");
        resp.setReservationId(reservation.getReservationId());
        resp.setReservationCode(reservation.getReservationCode());
        resp.setContractStatus("ACTIVE");
        resp.setUnitStatus(unitOpt.map(StorageUnit::getStatus).orElse("OCCUPIED"));
        resp.setInvoiceNumber(invoiceNumber);
        resp.setAmount(finalAmount);
        resp.setDiscountPercent(discountPercent);
        resp.setNewExpiryDate(newExpiry.toString());
        resp.setGatePin(gatePinCode);
        return resp;
    }

    /**
     * Lấy mã PIN động 15s mở cổng cơ sở 24/7 dành cho nhân viên (Staff Entry Pass)
     * - Tuân thủ Business Rule TTL 15 giây
     * - Tự động liên kết cơ sở nhân viên đang làm việc
     * - Lưu mã PIN vào bảng GatePin để hệ thống IoT và cổng xác thực hợp lệ
     */
    public StaffGatePinResponse getStaffLiveGatePin() {
        Integer accountId = getAuthenticatedAccountId();
        Integer facilityId = 1;

        if (accountId != null) {
            Optional<EmployeeProfile> employee = employeeProfileRepository.findByAccountId(accountId);
            if (employee.isPresent() && employee.get().getFacilityId() != null) {
                facilityId = employee.get().getFacilityId();
            }
        }

        Facility facility = facilityRepository.findById(facilityId).orElse(null);
        String facilityName = facility != null ? facility.getFacilityName() : "Cơ sở Cầu Giấy (Hà Nội)";
        String facilityCode = facility != null && facility.getFacilityCode() != null ? facility.getFacilityCode() : "HN-01";

        // Business Rule: TTL 15s đồng bộ với IoT Gate
        int ttlSeconds = 15 - (int) ((System.currentTimeMillis() / 1000) % 15);
        if (ttlSeconds <= 0) ttlSeconds = 15;

        long sec = System.currentTimeMillis() / 15000;
        int seed = Math.abs((int) (sec ^ (facilityCode.hashCode() + facilityId * 31)));
        int p1 = (seed % 900) + 100;
        int p2 = ((seed / 900) % 900) + 100;
        String rawPin = String.format("%03d%03d", p1, p2);
        String formattedPin = p1 + " " + p2;

        // Tìm một hợp đồng ACTIVE thuộc cơ sở này để gán gatePinId (đáp ứng foreign key constraint của GatePin)
        Integer activeContractId = null;
        List<Reservation> facilityReservations = reservationRepository.findByFacilityId(facilityId);
        for (Reservation res : facilityReservations) {
            Optional<Contract> cOpt = contractRepository.findByReservationId(res.getReservationId());
            if (cOpt.isPresent() && "ACTIVE".equalsIgnoreCase(cOpt.get().getStatus())) {
                activeContractId = cOpt.get().getContractId();
                break;
            }
        }
        if (activeContractId == null && !facilityReservations.isEmpty()) {
            for (Reservation res : facilityReservations) {
                Optional<Contract> cOpt = contractRepository.findByReservationId(res.getReservationId());
                if (cOpt.isPresent()) {
                    activeContractId = cOpt.get().getContractId();
                    break;
                }
            }
        }
        if (activeContractId == null) {
            activeContractId = contractRepository.findAll().stream().findFirst().map(Contract::getContractId).orElse(1);
        }

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expires = now.plusSeconds(ttlSeconds);
            Optional<GatePin> existingOpt = gatePinRepository.findTopByContractIdAndStatusOrderByGeneratedAtDesc(activeContractId, "ACTIVE");
            GatePin gatePin;
            if (existingOpt.isPresent()) {
                gatePin = existingOpt.get();
                gatePin.setPinCode(rawPin);
                gatePin.setGeneratedAt(now);
                gatePin.setExpiresAt(expires);
            } else {
                gatePin = new GatePin(activeContractId, rawPin, "ACTIVE", now, expires);
            }
            gatePinRepository.save(gatePin);
        } catch (Exception e) {
            System.err.println("Lỗi lưu staff gatepin: " + e.getMessage());
        }

        return new StaffGatePinResponse(
                true,
                formattedPin,
                rawPin,
                ttlSeconds,
                facilityId,
                facilityName,
                facilityCode,
                "Lấy mã PIN mở cổng thành công."
        );
    }

    @Transactional
    public ApiResponse updateCustomerCccd(Integer reservationId, String newCccd) {
        Integer staffAccountId = getAuthenticatedAccountId();
        if (staffAccountId == null) {
            return new ApiResponse(false, "Không tìm thấy tài khoản nhân viên đã xác thực.");
        }

        if (newCccd == null || !newCccd.trim().matches("^[0-9]{12}$")) {
            return new ApiResponse(false, "Số CCCD phải gồm đúng 12 chữ số.");
        }
        String formattedCccd = newCccd.trim();

        Optional<Reservation> reservationOpt = reservationRepository.findByReservationIdForUpdate(reservationId);
        if (reservationOpt.isEmpty()) {
            return new ApiResponse(false, "Không tìm thấy đơn đặt chỗ.");
        }
        Reservation reservation = reservationOpt.get();
        Integer customerAccountId = reservation.getAccountId();

        // Check if CCCD belongs to another customer
        Optional<CustomerProfile> existingCccd = customerProfileRepository.findByIdentityNumber(formattedCccd);
        if (existingCccd.isPresent() && !existingCccd.get().getAccountId().equals(customerAccountId)) {
            return new ApiResponse(false, "Số CCCD này đã thuộc về một khách hàng khác trên hệ thống.");
        }

        CustomerProfile profile = customerProfileRepository.findByAccountId(customerAccountId)
                .orElseGet(() -> new CustomerProfile(customerAccountId, formattedCccd));
        
        String oldCccd = profile.getIdentityNumber() != null ? profile.getIdentityNumber() : "Chưa có";
        profile.setIdentityNumber(formattedCccd);
        customerProfileRepository.save(profile);

        // Ghi nhận ActivityLog
        try {
            Account staffAccount = accountRepository.findById(staffAccountId.longValue()).orElse(null);
            String staffName = staffAccount != null ? staffAccount.getFullName() : "Staff #" + staffAccountId;
            ActivityLog log = new ActivityLog();
            log.setAccountId(staffAccountId);
            log.setAction("UPDATE_CUSTOMER_CCCD");
            log.setDescription("Nhân viên " + staffName + " đã hiệu chỉnh CCCD của khách (Mã đơn: " 
                    + reservation.getReservationCode() + ") từ " + oldCccd + " sang " + formattedCccd + " khi đối chiếu thẻ gốc tại quầy.");
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        } catch (Exception e) {}

        return new ApiResponse(true, "Hiệu chỉnh số CCCD thành công!");
    }
}
