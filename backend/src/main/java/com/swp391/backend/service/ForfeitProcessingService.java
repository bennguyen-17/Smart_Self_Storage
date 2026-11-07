package com.swp391.backend.service;

import com.swp391.backend.dto.TerminateViolationRequest;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Facility;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.GatePin;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.GatePinRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class ForfeitProcessingService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

        private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ImageStorageService imageStorageService;
    private final GatePinRepository gatePinRepository;
    private final PaymentRepository paymentRepository;
    private final AccountRepository accountRepository;
    private final FacilityRepository facilityRepository;
    private final EmailService emailService;

    public ForfeitProcessingService(ContractRepository contractRepository,
                                    ReservationRepository reservationRepository,
                                    StorageUnitRepository storageUnitRepository,
                                    FloorRepository floorRepository,
                                    EmployeeProfileRepository employeeProfileRepository,
                                    ActivityLogRepository activityLogRepository,
                                    ImageStorageService imageStorageService,
                                    GatePinRepository gatePinRepository,
                                    PaymentRepository paymentRepository,
                                    AccountRepository accountRepository,
                                    FacilityRepository facilityRepository,
                                    EmailService emailService) {
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.activityLogRepository = activityLogRepository;
        this.imageStorageService = imageStorageService;
        this.gatePinRepository = gatePinRepository;
        this.paymentRepository = paymentRepository;
        this.accountRepository = accountRepository;
        this.facilityRepository = facilityRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void markProcessed(Integer contractId, String note, java.util.List<Integer> evidenceImageIds, Integer managerAccountId) {
        if (note == null || note.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ghi chú xử lý tài sản là bắt buộc.");
        }
        if (managerAccountId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (evidenceImageIds == null || evidenceImageIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần tải lên minh chứng thanh lý trước khi xác nhận.");
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

        imageStorageService.attachForfeitEvidence(contractId, evidenceImageIds, managerAccountId);

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

    @Transactional
    public void terminateViolation(Integer contractId, String reason, java.util.List<Integer> evidenceImageIds, Integer managerAccountId) {
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần nhập lý do/mô tả vi phạm.");
        }

        EmployeeProfile manager = employeeProfileRepository.findByAccountId(managerAccountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        Contract contract = contractRepository.findByIdForUpdate(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));

        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus()) && !"OVERDUE".equalsIgnoreCase(contract.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ có thể xử lý vi phạm đối với hợp đồng đang hoạt động (ACTIVE) hoặc quá hạn (OVERDUE).");
        }

        Reservation reservation = reservationRepository.findById(contract.getReservationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đặt chỗ."));
        StorageUnit unit = storageUnitRepository.findByUnitCodeForUpdate(reservation.getUnitCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho."));
        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tầng kho."));
        if (!manager.getFacilityId().equals(floor.getFacilityId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Hợp đồng không thuộc cơ sở của bạn.");
        }

        if (evidenceImageIds != null && !evidenceImageIds.isEmpty()) {
            imageStorageService.attachForfeitEvidence(contractId, evidenceImageIds, managerAccountId);
        }

        LocalDateTime processedAt = LocalDateTime.now(VIETNAM_ZONE);

        // 1. Chuyển hợp đồng sang COMPLETED (lý do: PROHIBITED_GOODS_VIOLATION), tịch thu 100% tiền cọc (không hoàn tiền)
        contract.setStatus("COMPLETED");
        contract.setCancelReason("PROHIBITED_GOODS_VIOLATION: " + reason.trim());
        contract.setTerminatedAt(processedAt);
        contractRepository.save(contract);

        // 2. Ô kho trả về AVAILABLE
        unit.setStatus("AVAILABLE");
        storageUnitRepository.save(unit);

        // 3. Vô hiệu hóa Gate PIN mở cửa của hợp đồng này ngay lập tức
        List<GatePin> pins = gatePinRepository.findByContractId(contractId);
        for (GatePin p : pins) {
            p.setStatus("EXPIRED");
            gatePinRepository.save(p);
        }

        // 4. Hủy các hóa đơn phạt nợ nếu có
        List<Payment> penaltyPayments = paymentRepository.findByContractId(contractId).stream()
                .filter(p -> "OVERDUE_FEE".equalsIgnoreCase(p.getInvoiceType())
                        || (p.getInvoiceNumber() != null && (p.getInvoiceNumber().startsWith("PEN-") || p.getInvoiceNumber().startsWith("OVD-"))))
                .toList();
        for (Payment p : penaltyPayments) {
            if (!"PAID".equalsIgnoreCase(p.getStatus())) {
                p.setStatus("CANCELLED");
                p.setPaymentStatus("CANCELLED");
                p.setRemainingAmount(BigDecimal.ZERO);
                paymentRepository.save(p);
            }
        }

        // 5. Ghi vết kiểm toán
        ActivityLog log = new ActivityLog();
        log.setAccountId(managerAccountId);
        log.setFacilityId(floor.getFacilityId());
        log.setAction("CONTRACT_TERMINATED_VIOLATION");
        log.setDescription("Đã đơn phương chấm dứt HĐ #" + contractId + " (ô " + unit.getUnitCode() + ") do vi phạm: " + reason.trim());
        log.setCreatedAt(processedAt);
        activityLogRepository.save(log);

        // 6. Gửi email thông báo đơn phương chấm dứt hợp đồng do vi phạm
        try {
            Account customer = accountRepository.findAccountByAccountId(reservation.getAccountId()).orElse(null);
            if (customer != null && customer.getEmail() != null && !customer.getEmail().isBlank()) {
                String facilityName = facilityRepository.findById(floor.getFacilityId())
                        .map(Facility::getFacilityName)
                        .orElse("Smart Self Storage");
                String contractCode = reservation.getReservationCode() != null
                        ? reservation.getReservationCode()
                        : "CTR-" + contract.getContractId();
                emailService.sendViolationTerminationEmail(
                        customer.getEmail(),
                        customer.getFullName(),
                        contractCode,
                        unit.getUnitCode(),
                        facilityName,
                        reason.trim(),
                        processedAt
                );
            }
        } catch (Exception ignored) {
            // Lỗi email không làm rollback giao dịch chấm dứt vi phạm
        }
    }
}
