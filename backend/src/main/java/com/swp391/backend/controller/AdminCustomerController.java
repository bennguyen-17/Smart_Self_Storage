package com.swp391.backend.controller;

import com.swp391.backend.dto.AdminCustomerResponse;
import com.swp391.backend.service.AdminCustomerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;

    public AdminCustomerController(AdminCustomerService adminCustomerService) {
        this.adminCustomerService = adminCustomerService;
    }

    @GetMapping
    public ResponseEntity<List<AdminCustomerResponse>> searchCustomers(
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(adminCustomerService.searchCustomers(query));
    }

    @PatchMapping("/{accountId}/unlock")
    public ResponseEntity<AdminCustomerResponse> unlockCustomer(
            @PathVariable Integer accountId,
            @AuthenticationPrincipal Integer adminAccountId) {
        return ResponseEntity.ok(adminCustomerService.unlockCustomer(accountId, adminAccountId));
    }
}
