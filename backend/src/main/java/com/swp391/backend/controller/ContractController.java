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

    public ContractController(ContractRepository contractRepository,
                              ReservationRepository reservationRepository,
                              StorageUnitRepository storageUnitRepository,
                              FloorRepository floorRepository,
                              FacilityRepository facilityRepository,
                              StorageService storageService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.storageService = storageService;
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
            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(res.getUnitId());
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

            Map<String, Object> map = new HashMap<>();
            map.put("contractId", "#HD-" + c.getContractId());
            map.put("unitCode", "KHO-" + unit.getUnitId());
            map.put("branchName", branchName);
            map.put("branchCode", branchCode);
            map.put("size", "M");
            map.put("sizeLabel", "Size M");
            map.put("expiryDate", res.getEndDate().toString());
            map.put("daysLeft", daysLeft);
            map.put("status", c.getStatus());
            map.put("statusLabel", "ACTIVE".equalsIgnoreCase(c.getStatus()) ? "HIỆU LỰC" : "ĐÃ HẾT HẠN");

            result.add(map);
        }

        return ResponseEntity.ok(result);
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
