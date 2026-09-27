package com.swp391.backend.controller;

import com.swp391.backend.dto.HoldUnitRequest;
import com.swp391.backend.dto.HoldUnitResponse;
import com.swp391.backend.service.StorageUnitHoldService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final StorageUnitHoldService storageUnitHoldService;

    public BookingController(StorageUnitHoldService storageUnitHoldService) {
        this.storageUnitHoldService = storageUnitHoldService;
    }

    @PostMapping("/hold-unit")
    public ResponseEntity<HoldUnitResponse> holdUnit(
            @RequestBody HoldUnitRequest request,
            @AuthenticationPrincipal Integer accountId) {
        HoldUnitResponse response = storageUnitHoldService.holdUnit(
                request.getUnitId(),
                accountId
        );

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest().body(response);
    }
}
