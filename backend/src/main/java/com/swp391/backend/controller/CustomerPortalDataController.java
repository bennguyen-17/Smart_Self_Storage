package com.swp391.backend.controller;

import com.swp391.backend.dto.CustomerInvoiceResponse;
import com.swp391.backend.dto.CustomerNotificationResponse;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/customer")
public class CustomerPortalDataController {

    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final ActivityLogRepository activityLogRepository;

    public CustomerPortalDataController(ReservationRepository reservationRepository,
                                        ContractRepository contractRepository,
                                        PaymentRepository paymentRepository,
                                        ActivityLogRepository activityLogRepository) {
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<CustomerInvoiceResponse>> getCustomerInvoices(
            @AuthenticationPrincipal Integer accountId) {
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }

        List<Reservation> reservations = reservationRepository.findByAccountId(accountId);
        if (reservations.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        Map<Integer, Reservation> resMap = new HashMap<>();
        List<Integer> reservationIds = new ArrayList<>();
        for (Reservation r : reservations) {
            resMap.put(r.getReservationId(), r);
            reservationIds.add(r.getReservationId());
        }

        List<Contract> contracts = contractRepository.findByReservationIdIn(reservationIds);
        Map<Integer, Contract> contractMap = new HashMap<>();
        List<Integer> contractIds = new ArrayList<>();
        for (Contract c : contracts) {
            contractMap.put(c.getContractId(), c);
            contractIds.add(c.getContractId());
        }

        List<Payment> payments = contractIds.isEmpty() ? Collections.emptyList() : paymentRepository.findByContractIdIn(contractIds);
        List<CustomerInvoiceResponse> responses = new ArrayList<>();

        for (Payment p : payments) {
            CustomerInvoiceResponse item = new CustomerInvoiceResponse();
            item.setPaymentId(p.getPaymentId());
            item.setInvoiceNumber(p.getInvoiceNumber());
            item.setInvoiceType(p.getInvoiceType());
            item.setAmount(p.getAmount());
            item.setPaidAmount(p.getPaidAmount());
            item.setRemainingAmount(p.getRemainingAmount());
            item.setStatus(p.getStatus());
            item.setPaymentMethod(p.getPaymentMethod());
            item.setTransactionCode(p.getTransactionCode());
            item.setIssuedAt(p.getIssuedAt());
            item.setDueAt(p.getDueAt());
            item.setPaidAt(p.getPaidAt());

            // Gán tên loại thân thiện
            String invType = p.getInvoiceType() != null ? p.getInvoiceType().toUpperCase() : "";
            if ("DEP".equals(invType)) {
                item.setTypeName("Tiền cọc & Thuê kho");
            } else if ("EXT".equals(invType) || "MONTHLY_RENEWAL".equals(invType)) {
                item.setTypeName("Gia hạn hợp đồng");
            } else if ("PEN".equals(invType) || "OVERDUE_FEE".equals(invType)) {
                item.setTypeName("Phạt quá hạn trả kho");
            } else if ("CMP".equals(invType) || "INSPECTION_DAMAGE".equals(invType)) {
                item.setTypeName("Bồi thường hư hại");
            } else if ("REF".equals(invType)) {
                item.setTypeName("Hoàn trả tiền cọc");
            } else {
                item.setTypeName("Hóa đơn dịch vụ");
            }

            Contract c = contractMap.get(p.getContractId());
            if (c != null && c.getReservationId() != null) {
                Reservation r = resMap.get(c.getReservationId());
                if (r != null) {
                    item.setContractCode(r.getReservationCode() != null ? r.getReservationCode() : ("CTR-" + c.getContractId()));
                    item.setUnitCode(r.getUnitCode());
                }
            }

            responses.add(item);
        }

        // Sắp xếp mới nhất lên đầu
        responses.sort((a, b) -> {
            LocalDateTime tA = a.getIssuedAt() != null ? a.getIssuedAt() : LocalDateTime.MIN;
            LocalDateTime tB = b.getIssuedAt() != null ? b.getIssuedAt() : LocalDateTime.MIN;
            return tB.compareTo(tA);
        });

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<CustomerNotificationResponse>> getCustomerNotifications(
            @AuthenticationPrincipal Integer accountId) {
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }

        List<ActivityLog> logs = activityLogRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
        List<CustomerNotificationResponse> list = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

        for (ActivityLog log : logs) {
            String action = log.getAction() != null ? log.getAction() : "";
            String ip = (log.getIpAddress() != null && !log.getIpAddress().isBlank()) ? log.getIpAddress() : "Không xác định";
            String timeStr = log.getCreatedAt() != null ? log.getCreatedAt().format(formatter) : "";

            if ("LOGIN_SUCCESS".equalsIgnoreCase(action)) {
                list.add(new CustomerNotificationResponse(
                        "act-" + log.getActivityLogId(),
                        "Đăng nhập thành công",
                        "Đăng nhập hệ thống lúc " + timeStr + " (IP: " + ip + ")",
                        "INFO",
                        log.getCreatedAt(),
                        false,
                        "/profile"
                ));
            } else if ("LOGIN_FAILED".equalsIgnoreCase(action)) {
                list.add(new CustomerNotificationResponse(
                        "act-" + log.getActivityLogId(),
                        "Cảnh báo đăng nhập sai mật khẩu",
                        "Phát hiện lần thử đăng nhập không thành công lúc " + timeStr + " (IP: " + ip + ")",
                        "WARNING",
                        log.getCreatedAt(),
                        false,
                        "/profile"
                ));
            } else if (action.toUpperCase().contains("LOCK") || action.toUpperCase().contains("SUSPEND")) {
                list.add(new CustomerNotificationResponse(
                        "act-" + log.getActivityLogId(),
                        "Cảnh báo tài khoản tạm khóa",
                        "Tài khoản bị tạm khóa vì lý do an toàn lúc " + timeStr + " (IP: " + ip + ")",
                        "WARNING",
                        log.getCreatedAt(),
                        false,
                        "/profile"
                ));
            } else if (action.toUpperCase().contains("PASSWORD") || action.toUpperCase().contains("RESET")) {
                list.add(new CustomerNotificationResponse(
                        "act-" + log.getActivityLogId(),
                        "Bảo mật: Đổi mật khẩu",
                        "Mật khẩu tài khoản đã được thay đổi lúc " + timeStr + " (IP: " + ip + ")",
                        "INFO",
                        log.getCreatedAt(),
                        false,
                        "/profile"
                ));
            }
        }

        // Giới hạn 20 thông báo gần nhất
        if (list.size() > 20) {
            list = list.subList(0, 20);
        }

        return ResponseEntity.ok(list);
    }
}
