package com.swp391.backend.controller;

import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import com.swp391.backend.service.JwtService;
import com.swp391.backend.service.StorageService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ContractController {

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final FacilityRepository facilityRepository;
    private final StorageService storageService;
    private final UnitTypeRepository unitTypeRepository;
    private final GatePinRepository gatePinRepository;
    private final JwtService jwtService;

    public ContractController(ContractRepository contractRepository,
                              ReservationRepository reservationRepository,
                              StorageUnitRepository storageUnitRepository,
                              FloorRepository floorRepository,
                              FacilityRepository facilityRepository,
                              StorageService storageService,
                              UnitTypeRepository unitTypeRepository,
                              GatePinRepository gatePinRepository,
                              JwtService jwtService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.storageService = storageService;
        this.unitTypeRepository = unitTypeRepository;
        this.gatePinRepository = gatePinRepository;
        this.jwtService = jwtService;
    }

    @GetMapping("/contracts/my-contracts")
    public ResponseEntity<List<Map<String, Object>>> getMyContracts(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) Integer accountId) {

        Integer targetId = accountId;
        if (targetId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                if (userIdObj instanceof Number) {
                    targetId = ((Number) userIdObj).intValue();
                } else if (userIdObj != null) {
                    targetId = Integer.parseInt(userIdObj.toString());
                }
            } catch (Exception ignored) {}
        }
        if (targetId == null) {
            targetId = 7;
        }

        List<Reservation> reservations = reservationRepository.findByAccountId(targetId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Reservation res : reservations) {
            Optional<Contract> contractOpt = contractRepository.findByReservationId(res.getReservationId());
            if (contractOpt.isEmpty()) continue;

            Contract c = contractOpt.get();
            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
            if (unitOpt.isEmpty()) continue;

            StorageUnit unit = unitOpt.get();
            Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
            String branchName = "Cầu Giấy, Hà Nội";
            String branchCode = "HN-01";
            if (floorOpt.isPresent()) {
                Optional<Facility> facOpt = facilityRepository.findById(floorOpt.get().getFacilityId());
                if (facOpt.isPresent()) {
                    branchName = facOpt.get().getFacilityName();
                    branchCode = storageService.mapFacilityToResponse(facOpt.get()).getFacilityCode();
                }
            }

            long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), res.getEndDate());
            if (daysLeft < 0) daysLeft = 0;

            String size = "M";
            String sizeLabel = "Size M";
            Optional<UnitType> typeOpt = unitTypeRepository.findById(unit.getUnitTypeId());
            if (typeOpt.isPresent()) {
                UnitType ut = typeOpt.get();
                size = ut.getSize() != null ? ut.getSize() : "M";
                sizeLabel = ut.getTypeName() != null ? ut.getTypeName() : ("Size " + size);
            }

            String statusLabel;
            if ("PENDING_CHECKIN".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "CHỜ CHECK-IN";
            } else if ("ACTIVE".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "HIỆU LỰC";
            } else if ("INITIATED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "KHỞI TẠO";
            } else if ("OVERDUE".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "QUÁ HẠN";
            } else if ("TERMINATED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "ĐÃ THANH LÝ";
            } else if ("CANCELED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "ĐÃ HỦY CỌC";
            } else if ("FORFEITED".equalsIgnoreCase(c.getStatus())) {
                statusLabel = "MẤT CỌC";
            } else {
                statusLabel = c.getStatus();
            }

            Map<String, Object> map = new HashMap<>();
            map.put("contractId", "#HD-" + c.getContractId());
            map.put("rawContractId", c.getContractId());
            map.put("unitCode", unit.getUnitCode());
            map.put("branchName", branchName);
            map.put("branchCode", branchCode);
            map.put("size", size);
            map.put("sizeLabel", sizeLabel);
            map.put("startDate", res.getStartDate().toString());
            map.put("expiryDate", res.getEndDate().toString());
            map.put("rentalFee", res.getRentalAmount());
            map.put("depositFee", res.getDepositAmount());
            map.put("daysLeft", daysLeft);
            map.put("status", c.getStatus());
            map.put("statusLabel", statusLabel);

            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/contracts/{contractId}/cancel-deposit")
    public ResponseEntity<Map<String, Object>> cancelDeposit(@PathVariable Integer contractId) {
        Optional<Contract> contractOpt = contractRepository.findById(contractId);
        if (contractOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy hợp đồng!"));
        }
        Contract contract = contractOpt.get();
        contract.setStatus("CANCELED");
        contract.setTerminatedAt(java.time.LocalDateTime.now());
        contractRepository.save(contract);

        Optional<Reservation> resOpt = reservationRepository.findById(contract.getReservationId());
        if (resOpt.isPresent()) {
            Reservation res = resOpt.get();
            res.setStatus("CANCELLED");
            reservationRepository.save(res);

            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
            if (unitOpt.isPresent()) {
                StorageUnit unit = unitOpt.get();
                unit.setStatus("AVAILABLE");
                storageUnitRepository.save(unit);
            }
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Hủy đặt cọc thành công! Ô kho đã được mở khóa và hoàn trả trạng thái trống."));
    }

    /**
     * US-06: Sinh mã PIN mở cổng IoT 24/7
     * QUY TẮC NGHIỆP VỤ BẮT BUỘC:
     * - Chỉ cấp mã PIN nếu khách hàng có hợp đồng đang có HIỆU LỰC (ACTIVE) tại cơ sở đó.
     * - Nếu chỉ có hợp đồng CHỜ CHECK-IN hoặc ĐÃ HỦY CỌC, từ chối cấp mã PIN (hasAccess = false).
     * - Ghi nhận và đồng bộ mã PIN vào bảng gatepin trong MySQL.
     */
    @GetMapping("/gate-pins/live")
    public ResponseEntity<Map<String, Object>> getLiveGatePin(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) Integer accountId,
            @RequestParam(required = false) String branchCode) {

        Integer targetId = accountId;
        if (targetId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateTokenAndGetClaims(token);
                Object userIdObj = claims.get("userId");
                if (userIdObj instanceof Number) {
                    targetId = ((Number) userIdObj).intValue();
                } else if (userIdObj != null) {
                    targetId = Integer.parseInt(userIdObj.toString());
                }
            } catch (Exception ignored) {}
        }
        if (targetId == null) {
            targetId = 7;
        }

        String targetBranch = branchCode != null ? branchCode.trim() : "HN-01";

        // Tìm tất cả đặt chỗ của tài khoản trong MySQL
        List<Reservation> reservations = reservationRepository.findByAccountId(targetId);
        Contract activeContract = null;
        StorageUnit activeUnit = null;

        for (Reservation res : reservations) {
            Optional<Contract> contractOpt = contractRepository.findByReservationId(res.getReservationId());
            if (contractOpt.isEmpty()) continue;
            Contract c = contractOpt.get();

            // QUY TẮC BẮT BUỘC: Hợp đồng PHẢI ở trạng thái ACTIVE (HIỆU LỰC)
            if (!"ACTIVE".equalsIgnoreCase(c.getStatus())) {
                continue;
            }

            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitCode());
            if (unitOpt.isEmpty()) continue;
            StorageUnit unit = unitOpt.get();

            Optional<Floor> floorOpt = floorRepository.findById(unit.getFloorId());
            String cBranchCode = "HN-01";
            if (floorOpt.isPresent()) {
                Optional<Facility> facOpt = facilityRepository.findById(floorOpt.get().getFacilityId());
                if (facOpt.isPresent()) {
                    cBranchCode = storageService.mapFacilityToResponse(facOpt.get()).getFacilityCode();
                }
            }

            // Kiểm tra khớp mã cơ sở
            String normTarget = targetBranch.replace("-", "").toUpperCase();
            String normBranch = cBranchCode.replace("-", "").toUpperCase();

            if (normTarget.equals(normBranch) || targetBranch.equalsIgnoreCase(cBranchCode)) {
                activeContract = c;
                activeUnit = unit;
                break;
            }
        }

        // Nếu cơ sở này KHÔNG CÓ hợp đồng nào ACTIVE -> TUYỆT ĐỐI KHÔNG CẤP MÃ PIN
        if (activeContract == null) {
            Map<String, Object> errorResp = new HashMap<>();
            errorResp.put("success", false);
            errorResp.put("hasAccess", false);
            errorResp.put("message", "Cơ sở " + targetBranch + " hiện không có hợp đồng nào đang có HIỆU LỰC (ACTIVE). Không thể cấp mã PIN ra vào 24/7!");
            errorResp.put("branchCode", targetBranch);
            return ResponseEntity.status(403).body(errorResp);
        }

        // Khi có hợp đồng ACTIVE: Sinh mã PIN 6 số an toàn và lưu/cập nhật vào bảng gatepin trong MySQL
        long sec = System.currentTimeMillis() / 15000;
        int seed = Math.abs((int) (sec ^ (targetBranch.hashCode() + activeContract.getContractId() * 31)));
        int p1 = (seed % 900) + 100;
        int p2 = ((seed / 900) % 900) + 100;
        String rawPin = String.format("%03d%03d", p1, p2);
        String formattedPin = p1 + " " + p2;
        int ttlSeconds = 15 - (int) ((System.currentTimeMillis() / 1000) % 15);

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expires = now.plusSeconds(ttlSeconds);
            Optional<GatePin> existingOpt = gatePinRepository.findTopByContractIdAndStatusOrderByGeneratedAtDesc(activeContract.getContractId(), "ACTIVE");
            GatePin gatePin;
            if (existingOpt.isPresent()) {
                gatePin = existingOpt.get();
                gatePin.setPinCode(rawPin);
                gatePin.setGeneratedAt(now);
                gatePin.setExpiresAt(expires);
            } else {
                gatePin = new GatePin(activeContract.getContractId(), rawPin, "ACTIVE", now, expires);
            }
            gatePinRepository.save(gatePin);
        } catch (Exception e) {
            System.err.println("Lỗi lưu gatepin vào MySQL: " + e.getMessage());
        }

        Map<String, Object> data = new HashMap<>();
        data.put("success", true);
        data.put("hasAccess", true);
        data.put("pin", formattedPin);
        data.put("ttlSeconds", ttlSeconds);
        data.put("branchCode", targetBranch);
        data.put("contractId", "#HD-" + activeContract.getContractId());
        data.put("unitCode", activeUnit.getUnitCode());

        return ResponseEntity.ok(data);
    }
}
