package com.swp391.backend.controller;

import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import com.swp391.backend.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    public ContractController(ContractRepository contractRepository,
                              ReservationRepository reservationRepository,
                              StorageUnitRepository storageUnitRepository,
                              FloorRepository floorRepository,
                              FacilityRepository facilityRepository,
                              StorageService storageService,
                              UnitTypeRepository unitTypeRepository) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.storageService = storageService;
        this.unitTypeRepository = unitTypeRepository;
    }

    @GetMapping("/contracts/my-contracts")
    public ResponseEntity<List<Map<String, Object>>> getMyContracts(@RequestParam(required = false) Integer accountId) {
        Integer targetId = accountId != null ? accountId : 7;
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
            map.put("expiryDate", res.getEndDate().toString());
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

    @GetMapping("/gate-pins/live")
    public ResponseEntity<Map<String, Object>> getLiveGatePin(@RequestParam(required = false) String branchCode) {
        long sec = System.currentTimeMillis() / 30000;
        int seed = Math.abs((int) (sec ^ (branchCode != null ? branchCode.hashCode() : 123)));
        int p1 = (seed % 900) + 100;
        int p2 = ((seed / 900) % 900) + 100;

        Map<String, Object> data = new HashMap<>();
        data.put("pin", p1 + " " + p2);
        data.put("ttlSeconds", 30 - (int) ((System.currentTimeMillis() / 1000) % 30));
        data.put("branchCode", branchCode != null ? branchCode : "HN-01");

        return ResponseEntity.ok(data);
    }
}
