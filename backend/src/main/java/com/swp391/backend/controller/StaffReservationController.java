package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.CancelReservationRequest;
import com.swp391.backend.dto.ChangeUnitRequest;
import com.swp391.backend.service.StaffReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/reservations")
public class StaffReservationController {

    private final StaffReservationService staffReservationService;

    public StaffReservationController(StaffReservationService staffReservationService) {
        this.staffReservationService = staffReservationService;
    }

    @PostMapping("/{reservationId}/change-unit")
    public ResponseEntity<ApiResponse> changeUnit(
            @PathVariable Integer reservationId,
            @RequestBody ChangeUnitRequest request) {
        ApiResponse response = staffReservationService.changeUnit(reservationId, request.getNewUnitCode());
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/{reservationId}/cancel")
    public ResponseEntity<ApiResponse> cancelReservation(
            @PathVariable Integer reservationId,
            @RequestBody CancelReservationRequest request) {
        ApiResponse response = staffReservationService.cancelReservation(reservationId);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }
}
