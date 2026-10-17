package com.swp391.backend.service;

import com.swp391.backend.dto.ticket.*;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
        // Khung giờ làm việc của Staff 08:00 - 20:00
        LocalTime now = LocalTime.now();
        if (now.isBefore(LocalTime.of(8, 0)) || now.isAfter(LocalTime.of(20, 0))) {
            throw new IllegalArgumentException("Đã hết giờ làm việc của nhân viên (08:00 - 20:00), vui lòng liên hệ lại sau 08:00 sáng mai");
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketCode("TCK-INC-" + System.currentTimeMillis() % 1000000);
        ticket.setType("INCIDENT");
        ticket.setStatus("SUBMITTED");
        Integer targetCustomerId = customerId;
        if (customerId != null) {
            targetCustomerId = customerProfileRepository.findByAccountId(customerId)
                    .map(CustomerProfile::getCustomerId)
                    .orElse(customerId);
        }
        ticket.setCustomerId(targetCustomerId != null ? targetCustomerId : 1);
        ticket.setFacilityId(req.getFacilityId());
        ticket.setUnitCode(req.getUnitCode());
        ticket.setTitle(req.getTitle() != null ? req.getTitle() : "Báo sự cố ô kho");
        ticket.setDescription(req.getDescription());
        ticket.setCreatedAt(LocalDateTime.now());
        // Cam kết phản hồi SLA 15 phút
        ticket.setSlaDeadline(LocalDateTime.now().plusMinutes(15));
        ticket.setIsSlaBreached(false);
        ticket.setIdentityVerified(false);

        return supportTicketRepository.save(ticket);
    }

    // --- US-21: Tạo Ticket Hỗ trợ kỹ thuật 24/7 (Sự cố, Mở khóa, Bảo trì, Thắc mắc) ---
    @Transactional
    public SupportTicket createTicketGeneric(String type, String unitCode, String title, String description, Integer customerId) {
        SupportTicket ticket = new SupportTicket();
        String prefix = type != null ? type.toUpperCase() : "INC";
        if (prefix.length() > 5) prefix = prefix.substring(0, 5);
        ticket.setTicketCode("TCK-" + prefix + "-" + (System.currentTimeMillis() % 1000000));
        ticket.setType(type != null ? type.toUpperCase() : "INCIDENT");
        ticket.setStatus("SUBMITTED");

        Integer targetCustomerId = customerId;
        if (customerId != null) {
            targetCustomerId = customerProfileRepository.findByAccountId(customerId)
                    .map(CustomerProfile::getCustomerId)
                    .orElse(customerId);
        }
        ticket.setCustomerId(targetCustomerId != null ? targetCustomerId : 1);

        Integer facId = getFacilityIdByUnit(unitCode);
        if (facId == null) facId = 1;
        ticket.setFacilityId(facId);
        ticket.setUnitCode(unitCode);
        ticket.setTitle(title != null && !title.isEmpty() ? title : "Yêu cầu hỗ trợ: " + type);
        ticket.setDescription(description);
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setSlaDeadline(LocalDateTime.now().plusMinutes(15));
        ticket.setIsSlaBreached(false);
        ticket.setIdentityVerified("UNLOCK".equalsIgnoreCase(type) ? false : true);

        return supportTicketRepository.save(ticket);
    }

    @Transactional
    public SupportTicket createSupportFormTicket(Integer accountId, String type, String unitCode, String description, LocalDate desiredDate) {
        if (unitCode == null || unitCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ô kho có hợp đồng đang có hiệu lực (ACTIVE)!");
        }

        // Kiểm tra xem ô kho này có hợp đồng ACTIVE của account này hay không
        List<Reservation> reservations = reservationRepository.findByAccountId(accountId);
        Contract activeContract = null;
        for (Reservation res : reservations) {
            if (unitCode.equalsIgnoreCase(res.getUnitCode())) {
                Optional<Contract> cOpt = contractRepository.findByReservationId(res.getReservationId());
                if (cOpt.isPresent() && "ACTIVE".equalsIgnoreCase(cOpt.get().getStatus())) {
                    activeContract = cOpt.get();
                    break;
                }
            }
        }

        if (activeContract == null) {
            throw new IllegalArgumentException("Chỉ có thể gửi ticket hỗ trợ cho ô kho có hợp đồng đang HIỆU LỰC (ACTIVE)!");
        }

        Integer customerProfileId = customerProfileRepository.findByAccountId(accountId)
                .map(CustomerProfile::getCustomerId)
                .orElseGet(() -> {
                    CustomerProfile cp = new CustomerProfile(accountId, "0012010" + accountId);
                    return customerProfileRepository.save(cp).getCustomerId();
                });

        Integer facilityId = getFacilityIdByUnit(unitCode);

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketCode("TCK-" + (System.currentTimeMillis() % 1000000));
        ticket.setType(type != null ? type : "UNLOCK");
        ticket.setStatus("SUBMITTED");
        ticket.setCustomerId(customerProfileId);
        ticket.setFacilityId(facilityId);
        ticket.setUnitCode(unitCode);
        ticket.setContractId(activeContract.getContractId());
        if ("EARLY_TERMINATION".equalsIgnoreCase(type)) {
            ticket.setTitle("Yêu cầu trả kho sớm - Ô kho " + unitCode);
            ticket.setDesiredDate(desiredDate != null ? desiredDate : LocalDate.now());
            activeContract.setCancelReason("EARLY_TERMINATION");
            contractRepository.save(activeContract);
        } else {
            ticket.setTitle("Yêu cầu hỗ trợ: " + (type != null ? type : "UNLOCK") + " - Ô kho " + unitCode);
        }
        ticket.setDescription(description != null ? description : "");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setSlaDeadline(LocalDateTime.now().plusMinutes(15));
        ticket.setIsSlaBreached(false);
        ticket.setIdentityVerified(false);

        return supportTicketRepository.save(ticket);
    }

    @Transactional
    public SupportTicket createSupportFormTicket(Integer accountId, String type, String unitCode, String description) {
        return createSupportFormTicket(accountId, type, unitCode, description, null);
    }

    public SupportTicket saveTicket(SupportTicket ticket) {
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

        Long targetAccountId = Long.valueOf(customerId);
        Optional<CustomerProfile> cpOpt = customerProfileRepository.findById(customerId);
        if (cpOpt.isPresent() && cpOpt.get().getAccountId() != null) {
            targetAccountId = Long.valueOf(cpOpt.get().getAccountId());
        }

        Account account = accountRepository.findById(targetAccountId)
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

        Long targetAccountId = Long.valueOf(customerId);
        Optional<CustomerProfile> cpOpt = customerProfileRepository.findById(customerId);
        if (cpOpt.isPresent() && cpOpt.get().getAccountId() != null) {
            targetAccountId = Long.valueOf(cpOpt.get().getAccountId());
        }

        Account account = accountRepository.findById(targetAccountId)
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

        Integer targetCustomerId = customerId;
        if (customerId != null) {
            targetCustomerId = customerProfileRepository.findByAccountId(customerId)
                    .map(CustomerProfile::getCustomerId)
                    .orElse(customerId);
        }

        SupportTicket ticket = new SupportTicket();
        ticket.setTicketCode("TCK-TRM-" + System.currentTimeMillis() % 1000000);
        ticket.setType("EARLY_TERMINATION");
        ticket.setStatus("SUBMITTED");
        ticket.setCustomerId(targetCustomerId != null ? targetCustomerId : 1);
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
    public List<SupportTicket> getCustomerTickets(Integer accountOrCustomerId) {
        if (accountOrCustomerId == null) return Collections.emptyList();

        Set<Integer> targetCustomerIds = new LinkedHashSet<>();
        targetCustomerIds.add(accountOrCustomerId);

        // Trường hợp accountOrCustomerId là accountId: tìm customerProfile.customerId
        customerProfileRepository.findByAccountId(accountOrCustomerId)
                .ifPresent(cp -> targetCustomerIds.add(cp.getCustomerId()));

        // Trường hợp accountOrCustomerId là customerId: tìm customerProfile tương ứng
        customerProfileRepository.findById(accountOrCustomerId)
                .ifPresent(cp -> {
                    targetCustomerIds.add(cp.getCustomerId());
                    if (cp.getAccountId() != null) {
                        targetCustomerIds.add(cp.getAccountId());
                    }
                });

        List<SupportTicket> results = new ArrayList<>();
        Set<Long> seenIds = new HashSet<>();
        for (Integer cid : targetCustomerIds) {
            List<SupportTicket> list = supportTicketRepository.findByCustomerIdOrderByCreatedAtDesc(cid);
            for (SupportTicket t : list) {
                if (t.getId() != null && seenIds.add(t.getId())) {
                    results.add(t);
                }
            }
        }

        results.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        return results;
    }

    // --- US-22: 1. Staff xem hàng đợi Ticket của cơ sở kèm đếm lùi SLA 15 phút ---
    @Transactional
    public List<SupportTicket> getStaffTickets(Integer facilityId, String status, String type) {
        List<SupportTicket> tickets;
        if (facilityId == null || facilityId <= 0) {
            tickets = supportTicketRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        } else {
            tickets = supportTicketRepository.findByFacilityIdOrderByCreatedAtDesc(facilityId);
            if (tickets.isEmpty()) {
                tickets = supportTicketRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
            }
        }

        LocalDateTime now = LocalDateTime.now();
        // Kiểm tra & cập nhật cờ vi phạm SLA 15 phút, đồng thời nạp tên & SĐT khách
        for (SupportTicket t : tickets) {
            if (t.getCustomerId() != null) {
                try {
                    customerProfileRepository.findById(t.getCustomerId()).ifPresent(cp -> {
                        if (cp.getAccountId() != null) {
                            accountRepository.findById(Long.valueOf(cp.getAccountId())).ifPresent(acc -> {
                                t.setCustomerName(acc.getFullName());
                                t.setCustomerPhone(acc.getPhone());
                            });
                        }
                    });
                } catch (Exception ignored) {}
            }
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

        // Bắt buộc phải tích xác nhận CCCD trùng khớp 100%
        if (!Boolean.TRUE.equals(req.getIdentityVerified())) {
            throw new IllegalArgumentException("Bắt buộc phải tích xác nhận 'Đã kiểm tra và đối chiếu CCCD trùng khớp 100%' trước khi mở khóa hộ!");
        }

        if ("RESOLVED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Ticket này đã hoàn tất đóng trước đó (không cho phép mở lại ticket đã hoàn tất)!");
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

    // --- Staff hoàn tất và đóng ticket thông thường (Sự cố bảo trì, nghiệm thu xong, ...) ---
    @Transactional
    public SupportTicket resolveTicket(Long ticketId, String note, Integer staffId, Integer facilityId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ticket # " + ticketId));

        if (facilityId != null && ticket.getFacilityId() != null && !ticket.getFacilityId().equals(facilityId)) {
            throw new AccessDeniedException("Bạn không có quyền xử lý ticket của cơ sở khác!");
        }

        if ("RESOLVED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Ticket này đã hoàn tất đóng trước đó!");
        }

        ticket.setStatus("RESOLVED");
        ticket.setResolutionNote(note != null && !note.trim().isEmpty() ? note : "Đã xử lý và đóng ticket");
        ticket.setAssignedStaffId(staffId);
        ticket.setResolvedAt(LocalDateTime.now());

        SupportTicket saved = supportTicketRepository.save(ticket);

        if (activityLogRepository != null && staffId != null) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(staffId);
            log.setAction("RESOLVE_TICKET");
            log.setDescription(String.format("Nhân viên #%d đã xử lý hoàn tất ticket %s: %s",
                    staffId, ticket.getTicketCode(), ticket.getResolutionNote()));
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return saved;
    }
}
