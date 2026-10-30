package com.swp391.backend.controller;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.dto.CancelReservationRequest;
import com.swp391.backend.dto.ChangeUnitRequest;
import com.swp391.backend.dto.CollectPenaltyRequest;
import com.swp391.backend.dto.CollectPenaltyResponse;
import com.swp391.backend.dto.RenewAtCounterRequest;
import com.swp391.backend.dto.RenewAtCounterResponse;
import com.swp391.backend.dto.StaffCancelReservationResponse;
import com.swp391.backend.dto.StaffChangeUnitResponse;
import com.swp391.backend.dto.StaffCheckInRequest;
import com.swp391.backend.dto.StaffCheckInResponse;
import com.swp391.backend.dto.StaffGatePinResponse;
import com.swp391.backend.dto.StaffReservationListResponse;
import com.swp391.backend.dto.StaffReservationLookupResponse;
import com.swp391.backend.service.StaffReservationService;
import com.swp391.backend.service.StaffCheckInService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/reservations")
public class StaffReservationController {

    private final StaffReservationService staffReservationService;
    private final StaffCheckInService staffCheckInService;

    public StaffReservationController(StaffReservationService staffReservationService,
                                      StaffCheckInService staffCheckInService) {
        this.staffReservationService = staffReservationService;
        this.staffCheckInService = staffCheckInService;
    }

    @GetMapping
    public ResponseEntity<StaffReservationListResponse> listReservations() {
        StaffReservationListResponse response = staffReservationService.listReservations();
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(resolveErrorStatus(response.getMessage())).body(response);
    }

    @GetMapping("/lookup")
    public ResponseEntity<StaffReservationLookupResponse> lookupReservation(
            @RequestParam("code") String reservationCode) {
        StaffReservationLookupResponse response = staffReservationService.lookupReservation(reservationCode);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(resolveErrorStatus(response.getMessage())).body(response);
    }

    @GetMapping("/{reservationId}")
    public ResponseEntity<StaffReservationLookupResponse> getReservationById(
            @PathVariable Integer reservationId) {
        StaffReservationLookupResponse response = staffReservationService.getReservationDetail(reservationId);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(resolveErrorStatus(response.getMessage())).body(response);
    }

    @PostMapping("/{reservationId}/check-in")
    public ResponseEntity<StaffCheckInResponse> checkIn(
            @PathVariable Integer reservationId,
            @RequestBody StaffCheckInRequest request) {
        StaffCheckInResponse response = staffCheckInService.checkIn(reservationId, request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(resolveErrorStatus(response.getMessage())).body(response);
    }

    @PostMapping("/{reservationId}/change-unit")
    public ResponseEntity<StaffChangeUnitResponse> changeUnit(
            @PathVariable Integer reservationId,
            @RequestBody ChangeUnitRequest request) {
        StaffChangeUnitResponse response = staffReservationService.changeUnit(reservationId, request.getNewUnitCode());
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(resolveErrorStatus(response.getMessage())).body(response);
    }

    @PostMapping("/{reservationId}/cancel")
    public ResponseEntity<StaffCancelReservationResponse> cancelReservation(
            @PathVariable Integer reservationId,
            @RequestBody CancelReservationRequest request) {
        StaffCancelReservationResponse response = staffReservationService.cancelReservation(reservationId);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(resolveErrorStatus(response.getMessage())).body(response);
    }

    @PostMapping("/{reservationId}/collect-penalty")
    public ResponseEntity<CollectPenaltyResponse> collectPenalty(
            @PathVariable Integer reservationId,
            @RequestBody(required = false) CollectPenaltyRequest request) {
        CollectPenaltyResponse response = staffReservationService.collectPenalty(reservationId, request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(resolveErrorStatus(response.getMessage())).body(response);
    }

    @PostMapping("/{reservationId}/renew-at-counter")
    public ResponseEntity<RenewAtCounterResponse> renewAtCounter(
            @PathVariable Integer reservationId,
            @RequestBody(required = false) RenewAtCounterRequest request) {
        RenewAtCounterResponse response = staffReservationService.renewAtCounter(reservationId, request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(resolveErrorStatus(response.getMessage())).body(response);
    }

    @GetMapping("/gate-pin")
    public ResponseEntity<StaffGatePinResponse> getStaffGatePin() {
        StaffGatePinResponse response = staffReservationService.getStaffLiveGatePin();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{reservationId}/customer-cccd")
    public ResponseEntity<ApiResponse> updateCustomerCccd(
            @PathVariable Integer reservationId,
            @RequestBody Map<String, String> request) {
        String newCccd = request != null ? request.get("identityNumber") : null;
        String newName = request != null ? request.get("fullName") : null;
        ApiResponse response = staffReservationService.updateCustomerCccd(reservationId, newCccd, newName);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    private HttpStatus resolveErrorStatus(String message) {
        if (message == null) {
            return HttpStatus.BAD_REQUEST;
        }
        String lower = message.toLowerCase();

        if (lower.contains("not found")
                || lower.contains("does not belong to the staff member's facility")) {
            return HttpStatus.NOT_FOUND;
        }

        if (lower.contains("ca được phân công") || lower.contains("bắt đầu ca")) {
            return HttpStatus.FORBIDDEN;
        }

        if (lower.contains("pending_checkin")
                || lower.contains("not in a changeable status")
                || lower.contains("not in a cancellable status")
                || lower.contains("reserved")
                || lower.contains("available")
                || lower.contains("status is required")) {
            return HttpStatus.CONFLICT;
        }

        return HttpStatus.BAD_REQUEST;
    }
}
