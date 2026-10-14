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
            @RequestHeader(value = "X-Account-Id", required = false) Integer headerAccountId,
            Authentication authentication
    ) {
        try {
            Integer customerId = headerAccountId;
            if (customerId == null && authentication != null && authentication.getPrincipal() instanceof Integer) {
                customerId = (Integer) authentication.getPrincipal();
            }
            if (customerId == null) customerId = 1;

            String type = (String) body.getOrDefault("type", "INCIDENT");
            String unitCode = (String) body.getOrDefault("unitCode", "GATE");
            String description = (String) body.getOrDefault("description", "");
            String title = (String) body.getOrDefault("title", "Yêu cầu hỗ trợ: " + type);

            SupportTicket ticket = supportTicketService.createTicketGeneric(type, unitCode, title, description, customerId);
            return ResponseEntity.ok(Map.of("success", true, "data", ticket));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
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
            @RequestHeader(value = "X-Account-Id", required = false) Integer headerAccountId,
            Authentication authentication
    ) {
        Integer customerId = headerAccountId;
        if (customerId == null && authentication != null && authentication.getPrincipal() instanceof Integer) {
            customerId = (Integer) authentication.getPrincipal();
        }
        if (customerId == null) customerId = 1;
        return ResponseEntity.ok(supportTicketService.getCustomerTickets(customerId));
    }
}
