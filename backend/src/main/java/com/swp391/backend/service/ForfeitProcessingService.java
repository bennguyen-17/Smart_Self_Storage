package com.swp391.backend.service;

import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class ForfeitProcessingService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final ActivityLogRepository activityLogRepository;

    public ForfeitProcessingService(ContractRepository contractRepository,
                                    ReservationRepository reservationRepository,
                                    StorageUnitRepository storageUnitRepository,
                                    FloorRepository floorRepository,
                                    EmployeeProfileRepository employeeProfileRepository,
                                    ActivityLogRepository activityLogRepository) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @Transactional
    public void markProcessed(Integer contractId, String note, Integer managerAccountId) {
        if (note == null || note.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ghi chú xử lý tài sản là bắt buộc.");
        }
        if (managerAccountId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        EmployeeProfile manager = employeeProfileRepository.findByAccountId(managerAccountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        Contract contract = contractRepository.findByIdForUpdate(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
        if (!"FORFEITED".equalsIgnoreCase(contract.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ hợp đồng FORFEITED mới được xác nhận đã xử lý tài sản.");
        }
        if (contract.isForfeitProcessed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hợp đồng đã được xác nhận xử lý tài sản.");
        }

        Reservation reservation = reservationRepository.findById(contract.getReservationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đặt chỗ."));
        StorageUnit unit = storageUnitRepository.findByUnitCodeForUpdate(reservation.getUnitCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho."));
        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tầng kho."));
        if (!manager.getFacilityId().equals(floor.getFacilityId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Hợp đồng không thuộc cơ sở của Manager.");
        }

        LocalDateTime processedAt = LocalDateTime.now(VIETNAM_ZONE);
        unit.setStatus("MAINTENANCE");
        storageUnitRepository.save(unit);

        contract.setForfeitProcessed(true);
        contractRepository.save(contract);

        ActivityLog log = new ActivityLog();
        log.setAccountId(managerAccountId);
        log.setFacilityId(floor.getFacilityId());
        log.setAction("FORFEIT_ASSET_PROCESSED");
        log.setDescription("Đã cắt khóa và xử lý tài sản hợp đồng " + contractId
                + ", ô kho " + unit.getUnitCode() + ". Ghi chú: " + note.trim());
        log.setCreatedAt(processedAt);
        activityLogRepository.save(log);
    }
}
