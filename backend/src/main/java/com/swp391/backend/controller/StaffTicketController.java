package com.swp391.backend.controller;

import com.swp391.backend.dto.ticket.ResolveUnlockRequest;
import com.swp391.backend.dto.ticket.UnlockDetailResponse;
import com.swp391.backend.entity.SupportTicket;
import com.swp391.backend.service.SupportTicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/tickets")
public class StaffTicketController {

    private final SupportTicketService supportTicketService;

    public StaffTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    // Hàng đợi yêu cầu hỗ trợ của cơ sở kèm thời gian phản hồi cam kết 15 phút
    @GetMapping
    public ResponseEntity<?> getStaffTickets(
            @AuthenticationPrincipal Integer staffAccountId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type
    ) {
        try {
            List<SupportTicket> tickets = supportTicketService.getStaffTickets(staffAccountId, status, type);
            return ResponseEntity.ok(tickets);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Nhân viên tiếp nhận xử lý yêu cầu hỗ trợ
    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal Integer staffId
    ) {
        try {
            SupportTicket ticket = supportTicketService.acceptTicket(id, staffId);
            return ResponseEntity.ok(ticket);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Lấy thông tin đối chiếu giấy tờ tùy thân (CCCD) trên hợp đồng
    @GetMapping("/{id}/unlock-detail")
    public ResponseEntity<?> getUnlockDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal Integer staffAccountId
    ) {
        try {
            UnlockDetailResponse res = supportTicketService.getUnlockDetails(id, staffAccountId);
            return ResponseEntity.ok(res);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Hoàn tất mở khóa sau khi đã đối chiếu danh tính khách hàng
    @PostMapping("/{id}/resolve-unlock")
    public ResponseEntity<?> resolveUnlock(
            @PathVariable Long id,
            @RequestBody ResolveUnlockRequest request,
            @AuthenticationPrincipal Integer staffId
    ) {
        try {
            SupportTicket ticket = supportTicketService.resolveUnlockTicket(id, request, staffId);
            return ResponseEntity.ok(ticket);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // Hoàn tất xử lý yêu cầu hỗ trợ (bảo trì, vệ sinh, sự cố)
    @PostMapping("/{id}/resolve")
    public ResponseEntity<?> resolveTicket(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal Integer staffId
    ) {
        try {
            String note = (body != null) ? body.get("note") : null;
            SupportTicket ticket = supportTicketService.resolveTicket(id, note, staffId);
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
