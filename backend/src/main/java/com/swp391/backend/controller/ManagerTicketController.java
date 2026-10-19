package com.swp391.backend.controller;

import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.service.SupportTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
public class ManagerTicketController {

    private final SupportTicketService supportTicketService;

    public ManagerTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    /**
     * GET /api/manager/tickets: Lấy danh sách ticket của cơ sở (ưu tiên ESCALATED quá hạn 15p lên đầu)
     */
    @GetMapping("/tickets")
    public ResponseEntity<?> getManagerTickets(
            @RequestHeader(value = "X-Facility-Id", required = false) Integer headerFacilityId,
            @RequestParam(value = "facilityId", required = false) Integer queryFacilityId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type
    ) {
        try {
            Integer facilityId = (headerFacilityId != null) ? headerFacilityId : queryFacilityId;
            List<SupportTicket> tickets = supportTicketService.getManagerTickets(facilityId, status, type);
            return ResponseEntity.ok(tickets);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * POST /api/manager/tickets/{id}/accept: Quản lý trực tiếp bấm tiếp nhận ticket (chuyển sang IN_PROGRESS)
     */
    @PostMapping("/tickets/{id}/accept")
    public ResponseEntity<?> acceptTicket(
            @PathVariable Long id,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestHeader(value = "X-Account-Id", defaultValue = "1") Integer managerAccountId
    ) {
        try {
            SupportTicket ticket = supportTicketService.managerAcceptTicket(id, managerAccountId, facilityId);
            return ResponseEntity.ok(ticket);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * POST /api/manager/tickets/{id}/resolve: Quản lý trực tiếp đóng / giải quyết ticket cho khách hàng
     */
    @PostMapping("/tickets/{id}/resolve")
    public ResponseEntity<?> resolveTicket(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestHeader(value = "X-Account-Id", defaultValue = "1") Integer managerAccountId
    ) {
        try {
            String note = (body != null) ? body.get("note") : null;
            SupportTicket ticket = supportTicketService.managerResolveTicket(id, note, managerAccountId, facilityId);
            return ResponseEntity.ok(ticket);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
