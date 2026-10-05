package com.swp391.backend.service;

import com.swp391.backend.dto.ticket.*;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final ActivityLogRepository activityLogRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;

    public SupportTicketService(SupportTicketRepository supportTicketRepository,
                                ContractRepository contractRepository,
                                ReservationRepository reservationRepository,
                                AccountRepository accountRepository,
                                CustomerProfileRepository customerProfileRepository,
                                ActivityLogRepository activityLogRepository,
                                StorageUnitRepository storageUnitRepository,
                                FloorRepository floorRepository) {
        this.supportTicketRepository = supportTicketRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.activityLogRepository = activityLogRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
    }

    private Integer getFacilityIdByUnit(String unitCode) {
        if (unitCode == null) return null;
        return storageUnitRepository.findById(unitCode)
                .flatMap(u -> floorRepository.findById(u.getFloorId()))
                .map(Floor::getFacilityId)
                .orElse(null);
    }

    // --- US-21: 1. Danh sách FAQ Help Center ---
    public List<Map<String, String>> getFaqs() {
        List<Map<String, String>> faqs = new ArrayList<>();
        faqs.add(Map.of(
                "question", "Bảng giá thuê và quy chuẩn kích thước 4 size ô kho như thế nào?",
                "answer", "Hệ thống có 4 kích thước: Size S (1m x 1m x 2m - 600.000đ/tháng, cọc 500k), Size M (1.5m x 2m x 2m - 1.200.000đ/tháng, cọc 1tr), Size L (2m x 3m x 2m - 2.400.000đ/tháng, cọc 2tr), Size XL (2.5m x 4m x 2m - 4.000.000đ/tháng, cọc 3tr). Kho mát điều hòa cộng thêm 20% vào giá thuê."
        ));
        faqs.add(Map.of(
                "question", "Khung giờ làm việc của nhân viên hỗ trợ tại cơ sở là khi nào?",
                "answer", "Nhân viên trực tiếp hỗ trợ tại quầy từ 08:00 đến 20:00 hằng ngày. Ngoài khung giờ trên (20:00 - 08:00 sáng hôm sau), khách hàng vẫn có thể tự do ra vào kho 24/7 bằng Mã PIN động."
        ));
        faqs.add(Map.of(
                "question", "Các mặt hàng nào bị nghiêm cấm lưu trữ tại kho?",
                "answer", "Tuyệt đối cấm: Thực phẩm tươi sống/đông lạnh, động vật sống, chất dễ cháy nổ, hóa chất độc hại, vũ khí và các loại hàng hóa trái pháp luật. Vi phạm sẽ bị hủy hợp đồng và tịch thu cọc."
        ));
        return faqs;
    }

    // --- US-21: 2. Khách tạo Ticket Sự cố (INCIDENT) - Chặn ngoài giờ 08:00 - 20:00 ---
    @Transactional
    public SupportTicket createIncidentTicket(CreateIncidentRequest req, Integer customerId) {
        // [BR-41]: Khung giờ làm việc của Staff 08:00 - 20:00
        LocalTime now = LocalTime.now();
        if (now.isBefore(LocalTime.of(8, 0)) || now.isAfter(LocalTime.of(20, 0))) {
            throw new IllegalArgumentException("Đã hết giờ làm việc của nhân viên (08:00 - 20:00), vui lòng liên hệ lại sau 08:00 sáng mai");
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketCode("TCK-INC-" + System.currentTimeMillis() % 1000000);
        ticket.setType("INCIDENT");
        ticket.setStatus("SUBMITTED");
        ticket.setCustomerId(customerId);
        ticket.setFacilityId(req.getFacilityId());
        ticket.setUnitCode(req.getUnitCode());
        ticket.setTitle(req.getTitle() != null ? req.getTitle() : "Báo sự cố ô kho");
        ticket.setDescription(req.getDescription());
        ticket.setCreatedAt(LocalDateTime.now());
        // [BR-40]: Cam kết phản hồi SLA 15 phút
        ticket.setSlaDeadline(LocalDateTime.now().plusMinutes(15));
        ticket.setIsSlaBreached(false);
        ticket.setIdentityVerified(false);

        return supportTicketRepository.save(ticket);
    }

    // --- US-21: 3. Gửi OTP xác thực trả kho trước hạn ---
    @Transactional
    public Map<String, Object> sendEarlyTerminationOtp(Integer contractId, Integer customerId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng # " + contractId));

        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể yêu cầu trả kho cho hợp đồng đang có hiệu lực (ACTIVE)!");
        }

        Account account = accountRepository.findById(Long.valueOf(customerId))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản khách hàng!"));

        // Sinh mã OTP 6 số thực tế và lưu thời hạn 5 phút vào tài khoản
        String otp = String.format("%06d", new Random().nextInt(999999));
        account.setOtpCode(otp);
        account.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        accountRepository.save(account);

        return Map.of(
                "success", true,
                "message", "Mã xác thực OTP đã được gửi đến email đăng ký của bạn. Mã có hiệu lực trong 5 phút.",
                "contractId", contractId
        );
    }

    // --- US-21: 4. Khách tạo Ticket Trả kho trước hạn (EARLY_TERMINATION) - Gửi được 24/7 ---
    @Transactional
    public SupportTicket createEarlyTerminationTicket(CreateEarlyTerminationRequest req, Integer customerId) {
        if (req.getContractId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn hợp đồng cần trả kho!");
        }

        Contract contract = contractRepository.findById(req.getContractId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng!"));

        if (!"ACTIVE".equalsIgnoreCase(contract.getStatus())) {
            throw new IllegalArgumentException("Chỉ áp dụng trả kho cho hợp đồng đang hiệu lực (ACTIVE)!");
        }

        // Kiểm tra OTP thực tế từ tài khoản
        if (req.getOtpCode() == null || req.getOtpCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập mã OTP xác thực email!");
        }

        Account account = accountRepository.findById(Long.valueOf(customerId))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản khách hàng!"));

        if (account.getOtpCode() == null || !account.getOtpCode().equals(req.getOtpCode().trim())) {
            throw new IllegalArgumentException("Mã OTP không chính xác!");
        }
        if (account.getOtpExpiryTime() != null && account.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hiệu lực, vui lòng yêu cầu mã mới!");
        }

        // Hủy mã OTP sau khi xác thực thành công
        account.setOtpCode(null);
        account.setOtpExpiryTime(null);
        accountRepository.save(account);

        Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketCode("TCK-TRM-" + System.currentTimeMillis() % 1000000);
        ticket.setType("EARLY_TERMINATION");
        ticket.setStatus("SUBMITTED");
        ticket.setCustomerId(customerId);
        ticket.setContractId(contract.getContractId());
        ticket.setFacilityId(reservation != null ? getFacilityIdByUnit(reservation.getUnitCode()) : null);
        ticket.setUnitCode(reservation != null ? reservation.getUnitCode() : null);
        ticket.setTitle("Yêu cầu trả kho trước hạn");
        ticket.setDescription(req.getReason());
        ticket.setDesiredDate(req.getDesiredDate());
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setIsSlaBreached(false);
        ticket.setIdentityVerified(false);

        return supportTicketRepository.save(ticket);
    }

    // --- US-21: 5. Khách xem danh sách ticket của mình ---
    public List<SupportTicket> getCustomerTickets(Integer customerId) {
        return supportTicketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    // --- US-22: 1. Staff xem hàng đợi Ticket của cơ sở kèm đếm lùi SLA 15 phút ---
    @Transactional
    public List<SupportTicket> getStaffTickets(Integer facilityId, String status, String type) {
        if (facilityId == null) {
            throw new AccessDeniedException("Vui lòng cung cấp Header X-Facility-Id của Nhân viên!");
        }

        List<SupportTicket> tickets = supportTicketRepository.findByFacilityIdOrderByCreatedAtDesc(facilityId);

        LocalDateTime now = LocalDateTime.now();
        // Kiểm tra & cập nhật cờ vi phạm SLA 15 phút
        for (SupportTicket t : tickets) {
            if ("INCIDENT".equalsIgnoreCase(t.getType())
                    && "SUBMITTED".equalsIgnoreCase(t.getStatus())
                    && t.getSlaDeadline() != null
                    && now.isAfter(t.getSlaDeadline())) {
                if (!Boolean.TRUE.equals(t.getIsSlaBreached())) {
                    t.setIsSlaBreached(true);
                    supportTicketRepository.save(t);
                }
            }
        }

        return tickets.stream()
                .filter(t -> status == null || status.trim().isEmpty() || t.getStatus().equalsIgnoreCase(status))
                .filter(t -> type == null || type.trim().isEmpty() || t.getType().equalsIgnoreCase(type))
                .collect(Collectors.toList());
    }

    // --- US-22: 2. Staff bấm Tiếp nhận Ticket (SUBMITTED -> IN_PROGRESS) ---
    @Transactional
    public SupportTicket acceptTicket(Long ticketId, Integer staffId, Integer facilityId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ticket # " + ticketId));

        if (facilityId != null && ticket.getFacilityId() != null && !ticket.getFacilityId().equals(facilityId)) {
            throw new AccessDeniedException("Bạn không có quyền tiếp nhận ticket của cơ sở khác!");
        }

        if (!"SUBMITTED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Ticket này đã được tiếp nhận hoặc đã xử lý xong!");
        }

        ticket.setStatus("IN_PROGRESS");
        ticket.setAssignedStaffId(staffId);
        return supportTicketRepository.save(ticket);
    }

    // --- US-23: 1. Lấy thông tin đối chiếu CCCD cho màn hình Mở khóa hộ ---
    public UnlockDetailResponse getUnlockDetails(Long ticketId, Integer facilityId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ticket # " + ticketId));

        if (facilityId != null && ticket.getFacilityId() != null && !ticket.getFacilityId().equals(facilityId)) {
            throw new AccessDeniedException("Bạn không có quyền xem thông tin cơ sở khác!");
        }

        UnlockDetailResponse res = new UnlockDetailResponse();
        res.setTicketId(ticket.getId());
        res.setTicketCode(ticket.getTicketCode());
        res.setUnitCode(ticket.getUnitCode());
        res.setStatus(ticket.getStatus());
        res.setContractId(ticket.getContractId());

        Account account = accountRepository.findById(Long.valueOf(ticket.getCustomerId())).orElse(null);
        if (account != null) {
            res.setCustomerName(account.getFullName());
            res.setPhone(account.getPhone());
        }

        CustomerProfile profile = customerProfileRepository.findByAccountId(ticket.getCustomerId()).orElse(null);
        if (profile != null) {
            res.setIdentityNumber(profile.getIdentityNumber());
        }

        return res;
    }

    // --- US-23: 2. Staff xác nhận đối chiếu CCCD và hoàn tất mở khóa hộ ---
    @Transactional
    public SupportTicket resolveUnlockTicket(Long ticketId, ResolveUnlockRequest req, Integer staffId, Integer facilityId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ticket # " + ticketId));

        if (facilityId != null && ticket.getFacilityId() != null && !ticket.getFacilityId().equals(facilityId)) {
            throw new AccessDeniedException("Bạn không có quyền xử lý ticket của cơ sở khác!");
        }

        // [BR-39]: Bắt buộc phải tích xác nhận CCCD trùng khớp 100%
        if (!Boolean.TRUE.equals(req.getIdentityVerified())) {
            throw new IllegalArgumentException("Bắt buộc phải tích xác nhận 'Đã kiểm tra và đối chiếu CCCD trùng khớp 100%' trước khi mở khóa hộ!");
        }

        if ("RESOLVED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Ticket này đã hoàn tất đóng trước đó (không cho phép Reopen theo BR-42)!");
        }

        ticket.setStatus("RESOLVED");
        ticket.setIdentityVerified(true);
        ticket.setResolutionNote(req.getNote() != null ? req.getNote() : "Đã đối chiếu CCCD bản gốc trùng khớp 100% và hỗ trợ mở khóa");
        ticket.setAssignedStaffId(staffId);
        ticket.setResolvedAt(LocalDateTime.now());

        SupportTicket saved = supportTicketRepository.save(ticket);

        // Ghi nhận ActivityLog
        if (activityLogRepository != null && staffId != null) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(staffId);
            log.setAction("RESOLVE_UNLOCK_TICKET");
            log.setDescription(String.format("Nhân viên #%d xác nhận đối chiếu CCCD trùng khớp và mở khóa hộ ô %s (Ticket: %s)",
                    staffId, ticket.getUnitCode(), ticket.getTicketCode()));
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return saved;
    }
}
