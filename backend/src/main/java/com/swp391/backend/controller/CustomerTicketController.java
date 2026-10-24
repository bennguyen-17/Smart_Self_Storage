package com.swp391.backend.controller;

import com.swp391.backend.dto.ticket.CreateEarlyTerminationRequest;
import com.swp391.backend.dto.ticket.CreateIncidentRequest;
import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.service.SupportTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class CustomerTicketController {

    private final SupportTicketService supportTicketService;

    public CustomerTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    // --- US-21: Gửi Ticket Hỗ trợ kỹ thuật tổng hợp 24/7 (Sự cố, Mở khóa, Bảo trì, Khác) ---
    @PostMapping("/support/tickets")
    public ResponseEntity<?> submitSupportTicket(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            Integer accountId = (authentication != null && authentication.getPrincipal() instanceof Integer)
                    ? (Integer) authentication.getPrincipal() : null;
            if (accountId == null) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Vui lòng đăng nhập để gửi yêu cầu hỗ trợ!"));
            }

            String type = body.get("type") != null ? body.get("type").toString() : "UNLOCK";
            String unitCode = body.get("unitCode") != null ? body.get("unitCode").toString() : "";
            String description = body.get("description") != null ? body.get("description").toString() : "";
            String desiredDateStr = body.get("desiredDate") != null ? body.get("desiredDate").toString() : null;
            java.time.LocalDate desiredDate = null;
            if (desiredDateStr != null && !desiredDateStr.trim().isEmpty()) {
                try {
                    desiredDate = java.time.LocalDate.parse(desiredDateStr.trim());
                } catch (Exception ignored) {}
            }

            SupportTicket ticket;
            if (unitCode != null && !unitCode.trim().isEmpty() && !"GATE".equalsIgnoreCase(unitCode)) {
                ticket = supportTicketService.createSupportFormTicket(accountId, type, unitCode, description, desiredDate);
            } else {
                String title = body.get("title") != null ? body.get("title").toString() : "Yêu cầu hỗ trợ: " + type;
                ticket = supportTicketService.createTicketGeneric(type, unitCode, title, description, accountId);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "ticketId", ticket.getTicketCode(),
                    "status", ticket.getStatus(),
                    "unitCode", ticket.getUnitCode() != null ? ticket.getUnitCode() : "",
                    "data", ticket
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // --- US-21: 1. Tra cứu FAQ Help Center ---
    @GetMapping("/help/faq")
    public ResponseEntity<?> getFaqs() {
        return ResponseEntity.ok(supportTicketService.getFaqs());
    }

    // --- US-21: 2. Gửi Ticket Báo sự cố (08:00 - 20:00) ---
    @PostMapping("/customer/tickets/incident")
    public ResponseEntity<?> createIncidentTicket(
            @RequestBody CreateIncidentRequest request,
            @RequestHeader(value = "X-Account-Id", defaultValue = "1") Integer customerId
    ) {
        try {
            SupportTicket ticket = supportTicketService.createIncidentTicket(request, customerId);
            return ResponseEntity.ok(ticket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // --- US-21: 3. Gửi OTP email yêu cầu trả kho trước hạn ---
    @PostMapping("/customer/tickets/early-termination/send-otp")
    public ResponseEntity<?> sendEarlyTerminationOtp(
            @RequestParam Integer contractId,
            @RequestHeader(value = "X-Account-Id", defaultValue = "1") Integer customerId
    ) {
        try {
            return ResponseEntity.ok(supportTicketService.sendEarlyTerminationOtp(contractId, customerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // --- US-21: 4. Gửi Ticket Trả kho trước hạn (24/7) ---
    @PostMapping("/customer/tickets/early-termination")
    public ResponseEntity<?> createEarlyTerminationTicket(
            @RequestBody CreateEarlyTerminationRequest request,
            @RequestHeader(value = "X-Account-Id", defaultValue = "1") Integer customerId
    ) {
        try {
            SupportTicket ticket = supportTicketService.createEarlyTerminationTicket(request, customerId);
            return ResponseEntity.ok(ticket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // --- US-21: 5. Khách hàng xem lịch sử ticket của mình ---
    @GetMapping("/customer/tickets")
    public ResponseEntity<?> getMyTickets(
            Authentication authentication
    ) {
        Integer accountId = (authentication != null && authentication.getPrincipal() instanceof Integer)
                ? (Integer) authentication.getPrincipal() : null;
        if (accountId == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập để xem danh sách ticket!"));
        }
        return ResponseEntity.ok(supportTicketService.getCustomerTickets(accountId));
    }
}
