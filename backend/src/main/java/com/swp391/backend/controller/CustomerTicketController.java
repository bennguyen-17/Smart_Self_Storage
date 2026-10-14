package com.swp391.backend.controller;

import com.swp391.backend.dto.ticket.CreateEarlyTerminationRequest;
import com.swp391.backend.dto.ticket.CreateIncidentRequest;
import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.service.SupportTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CustomerTicketController {

    private final SupportTicketService supportTicketService;

    public CustomerTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
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
            @RequestHeader(value = "X-Account-Id", defaultValue = "1") Integer customerId
    ) {
        return ResponseEntity.ok(supportTicketService.getCustomerTickets(customerId));
    }

    // --- US-21: 6. Khách hàng gửi Ticket hỗ trợ kỹ thuật từ SupportForm ---
    @PostMapping("/support/tickets")
    public ResponseEntity<?> submitSupportTicket(
            @RequestBody java.util.Map<String, Object> body,
            @RequestHeader(value = "X-Account-Id", required = false) Integer customerId
    ) {
        String type = body.get("type") != null ? body.get("type").toString() : "UNLOCK";
        String unitCode = body.get("unitCode") != null ? body.get("unitCode").toString() : "";
        String description = body.get("description") != null ? body.get("description").toString() : "";

        Integer accountId = customerId;
        if (accountId == null && body.get("accountId") != null) {
            try {
                accountId = Integer.parseInt(body.get("accountId").toString());
            } catch (Exception ignored) {}
        }
        if (accountId == null) {
            accountId = 13;
        }

        try {
            SupportTicket saved = supportTicketService.createSupportFormTicket(accountId, type, unitCode, description);
            return ResponseEntity.ok(java.util.Map.of(
                    "success", true,
                    "ticketId", saved.getTicketCode(),
                    "status", saved.getStatus(),
                    "unitCode", saved.getUnitCode()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }
}
