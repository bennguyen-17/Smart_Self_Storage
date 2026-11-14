package com.swp391.backend.controller;

import com.swp391.backend.config.SecurityContextHelper;
import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.service.SupportTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
     * GET /api/manager/tickets: Lấy danh sách ticket của cơ sở 
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
}
