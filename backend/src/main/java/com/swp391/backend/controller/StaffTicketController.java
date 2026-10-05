package com.swp391.backend.controller;

import com.swp391.backend.dto.ticket.ResolveUnlockRequest;
import com.swp391.backend.dto.ticket.UnlockDetailResponse;
import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.service.SupportTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffTicketController {

    private final SupportTicketService supportTicketService;

    public StaffTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    // --- US-22: 1. Xem hàng đợi Ticket của cơ sở kèm đếm ngược SLA 15 phút ---
    @GetMapping("/tickets")
    public ResponseEntity<?> getStaffTickets(
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type
    ) {
        try {
            List<SupportTicket> tickets = supportTicketService.getStaffTickets(facilityId, status, type);
            return ResponseEntity.ok(tickets);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- US-22: 2. Staff bấm Tiếp nhận Ticket (chuyển sang IN_PROGRESS) ---
    @PostMapping("/tickets/{id}/accept")
    public ResponseEntity<?> acceptTicket(
            @PathVariable Long id,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestHeader(value = "X-Account-Id", defaultValue = "1") Integer staffId
    ) {
        try {
            SupportTicket ticket = supportTicketService.acceptTicket(id, staffId, facilityId);
            return ResponseEntity.ok(ticket);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // --- US-23: 1. Mở modal đối chiếu CCCD lưu trên Hợp đồng ---
    @GetMapping("/tickets/{id}/unlock-detail")
    public ResponseEntity<?> getUnlockDetails(
            @PathVariable Long id,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId
    ) {
        try {
            UnlockDetailResponse res = supportTicketService.getUnlockDetails(id, facilityId);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- US-23: 2. Hoàn tất mở khóa hộ (bắt buộc identityVerified == true) ---
    @PostMapping("/tickets/{id}/resolve-unlock")
    public ResponseEntity<?> resolveUnlock(
            @PathVariable Long id,
            @RequestBody ResolveUnlockRequest request,
            @RequestHeader(value = "X-Facility-Id", required = false) Integer facilityId,
            @RequestHeader(value = "X-Account-Id", defaultValue = "1") Integer staffId
    ) {
        try {
            SupportTicket ticket = supportTicketService.resolveUnlockTicket(id, request, staffId, facilityId);
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
