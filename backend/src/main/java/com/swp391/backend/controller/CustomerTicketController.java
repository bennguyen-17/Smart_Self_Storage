package com.swp391.backend.controller;

import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.service.SupportTicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/customer/tickets")
public class CustomerTicketController {

    private final SupportTicketService supportTicketService;

    public CustomerTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    // Gửi yêu cầu hỗ trợ kỹ thuật trực tuyến 24/7
    @PostMapping
    public ResponseEntity<?> submitSupportTicket(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        try {
            Integer accountId = (authentication != null && authentication.getPrincipal() instanceof Integer)
                    ? (Integer) authentication.getPrincipal() : null;
            if (accountId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
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
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("success", false, "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Xem lịch sử các yêu cầu hỗ trợ của khách hàng
    @GetMapping
    public ResponseEntity<?> getMyTickets(
            Authentication authentication
    ) {
        Integer accountId = (authentication != null && authentication.getPrincipal() instanceof Integer)
                ? (Integer) authentication.getPrincipal() : null;
        if (accountId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập để xem danh sách ticket!"));
        }
        return ResponseEntity.ok(supportTicketService.getCustomerTickets(accountId));
    }
}
