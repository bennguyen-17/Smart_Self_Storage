package com.swp391.backend.controller;

import com.swp391.backend.dto.CustomerInvoiceResponse;
import com.swp391.backend.dto.CustomerNotificationResponse;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.SupportTicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/customer")
public class CustomerPortalDataController {

    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final SupportTicketRepository supportTicketRepository;

    public CustomerPortalDataController(ReservationRepository reservationRepository,
                                        ContractRepository contractRepository,
                                        PaymentRepository paymentRepository,
                                        SupportTicketRepository supportTicketRepository) {
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.supportTicketRepository = supportTicketRepository;
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

        List<CustomerNotificationResponse> list = new ArrayList<>();
        List<Reservation> reservations = reservationRepository.findByAccountId(accountId);
        LocalDate today = LocalDate.now();

        for (Reservation r : reservations) {
            String code = r.getReservationCode() != null ? r.getReservationCode() : ("Đơn #" + r.getReservationId());
            String unit = r.getUnitCode() != null ? r.getUnitCode() : "";

            if (r.getEndDate() != null) {
                long daysUntilExpiry = ChronoUnit.DAYS.between(today, r.getEndDate());
                if (daysUntilExpiry == 7 || daysUntilExpiry == 3 || daysUntilExpiry == 1) {
                    list.add(new CustomerNotificationResponse(
                            "exp-" + r.getReservationId() + "-" + daysUntilExpiry,
                            "Nhắc hạn thuê kho (" + code + ")",
                            "Hợp đồng thuê ô " + unit + " sẽ hết hạn sau " + daysUntilExpiry + " ngày (ngày " + r.getEndDate() + "). Vui lòng gia hạn hoặc chuẩn bị trả kho.",
                            "REMINDER",
                            LocalDateTime.now().minusHours(2),
                            false,
                            "/storage"
                    ));
                } else if (daysUntilExpiry < 0 && daysUntilExpiry >= -30) {
                    long overdueDays = Math.abs(daysUntilExpiry);
                    list.add(new CustomerNotificationResponse(
                            "ovd-" + r.getReservationId(),
                            "Cảnh báo hợp đồng quá hạn (" + code + ")",
                            "Hợp đồng ô " + unit + " đã quá hạn " + overdueDays + " ngày. Phí phạt 50.000đ/ngày. Vui lòng liên hệ cơ sở để xử lý.",
                            "WARNING",
                            LocalDateTime.now().minusHours(1),
                            false,
                            "/storage"
                    ));
                }
            }
        }

        // Thông báo về ticket hỗ trợ
        List<SupportTicket> tickets = supportTicketRepository.findByCustomerIdOrderByCreatedAtDesc(accountId);
        for (SupportTicket t : tickets) {
            if ("RESOLVED".equalsIgnoreCase(t.getStatus())) {
                list.add(new CustomerNotificationResponse(
                        "tck-res-" + t.getId(),
                        "Yêu cầu hỗ trợ đã xử lý",
                        "Yêu cầu #" + t.getTicketCode() + " đã được nhân viên cơ sở giải quyết hoàn tất.",
                        "SUCCESS",
                        t.getResolvedAt() != null ? t.getResolvedAt() : t.getCreatedAt(),
                        true,
                        "/support?tab=tickets"
                ));
            } else if ("IN_PROGRESS".equalsIgnoreCase(t.getStatus())) {
                list.add(new CustomerNotificationResponse(
                        "tck-inp-" + t.getId(),
                        "Yêu cầu hỗ trợ đang xử lý",
                        "Nhân viên cơ sở đang tiếp nhận và kiểm tra yêu cầu #" + t.getTicketCode() + " của bạn.",
                        "INFO",
                        t.getAcceptedAt() != null ? t.getAcceptedAt() : t.getCreatedAt(),
                        false,
                        "/support?tab=tickets"
                ));
            }
        }

        // Sắp xếp mới nhất lên đầu, giới hạn 20 thông báo
        list.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        if (list.size() > 20) {
            list = list.subList(0, 20);
        }

        return ResponseEntity.ok(list);
    }
}
