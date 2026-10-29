package com.swp391.backend.controller;

import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.service.SupportTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager/tickets")
public class ManagerTicketController {

    private final SupportTicketService supportTicketService;
    private final SecurityContextHelper securityContextHelper;

    public ManagerTicketController(SupportTicketService supportTicketService, SecurityContextHelper securityContextHelper) {
        this.supportTicketService = supportTicketService;
        this.securityContextHelper = securityContextHelper;
    }

    /**
     * GET /api/manager/tickets: Lấy danh sách ticket của cơ sở (ưu tiên ESCALATED quá hạn 15p lên đầu)
     */
    @GetMapping
    public ResponseEntity<?> getManagerTickets(
            @AuthenticationPrincipal Integer authAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer headerFacilityId,
            @RequestParam(value = "facilityId", required = false) Integer queryFacilityId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type
    ) {
        try {
            Integer fallback = (headerFacilityId != null) ? headerFacilityId : queryFacilityId;
            Integer facilityId = securityContextHelper.requireCurrentFacilityId(authAccountId, fallback);
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
    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal Integer authAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer headerAccountId
    ) {
        try {
            Integer effectiveAccountId = authAccountId != null ? authAccountId : (headerAccountId != null ? headerAccountId : 1);
            Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(effectiveAccountId, facilityId);
            SupportTicket ticket = supportTicketService.managerAcceptTicket(id, effectiveAccountId, effectiveFacilityId);
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
    @PostMapping("/{id}/resolve")
    public ResponseEntity<?> resolveTicket(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal Integer authAccountId,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestHeader(value = "X-Account-Id", required = false) Integer headerAccountId
    ) {
        try {
            Integer effectiveAccountId = authAccountId != null ? authAccountId : (headerAccountId != null ? headerAccountId : 1);
            Integer effectiveFacilityId = securityContextHelper.requireCurrentFacilityId(effectiveAccountId, facilityId);
            String note = (body != null) ? body.get("note") : null;
            SupportTicket ticket = supportTicketService.managerResolveTicket(id, note, effectiveAccountId, effectiveFacilityId);
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
