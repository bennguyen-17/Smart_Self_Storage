package com.swp391.backend.service;

import com.swp391.backend.dto.ticket.ResolveUnlockRequest;
import com.swp391.backend.dto.ticket.UnlockDetailResponse;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.LocalDateTime;
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
    private final FacilityRepository facilityRepository;
    private final StaffShiftService staffShiftService;
    private final NoShowCronService noShowCronService;

    public SupportTicketService(SupportTicketRepository supportTicketRepository,
                                ContractRepository contractRepository,
                                ReservationRepository reservationRepository,
                                AccountRepository accountRepository,
                                CustomerProfileRepository customerProfileRepository,
                                ActivityLogRepository activityLogRepository,
                                StorageUnitRepository storageUnitRepository,
                                FloorRepository floorRepository,
                                FacilityRepository facilityRepository,
                                StaffShiftService staffShiftService,
                                NoShowCronService noShowCronService) {
        this.supportTicketRepository = supportTicketRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.activityLogRepository = activityLogRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.facilityRepository = facilityRepository;
        this.staffShiftService = staffShiftService;
        this.noShowCronService = noShowCronService;
    }

    private Integer getFacilityIdByUnit(String unitCode) {
        if (unitCode == null) return null;
        return storageUnitRepository.findById(unitCode)
                .flatMap(u -> floorRepository.findById(u.getFloorId()))
                .map(Floor::getFacilityId)
                .orElse(null);
    }

    public synchronized String generateTicketCode() {
        String yearMonth = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        long nextIndex = supportTicketRepository.count() + 1;
        String candidate = String.format("TCK-%s-%03d", yearMonth, nextIndex);
        while (supportTicketRepository.findByTicketCode(candidate).isPresent()) {
            nextIndex++;
            candidate = String.format("TCK-%s-%03d", yearMonth, nextIndex);
        }
        return candidate;
    }

    @Transactional
    public SupportTicket createTicketGeneric(String type, String unitCode, String title, String description, Integer customerId) {
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketCode(generateTicketCode());
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

        return "INCIDENT".equalsIgnoreCase(ticket.getType())
                ? saveIncidentWithAssignment(ticket, customerId)
                : logCreatedTicket(supportTicketRepository.save(ticket), customerId);
    }

    @Transactional
    public SupportTicket createSupportFormTicket(Integer accountId, String type, String unitCode, String description, LocalDate desiredDate) {
        if (unitCode == null || unitCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ô kho có hợp đồng đang có hiệu lực (ACTIVE)!");
        }

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
        ticket.setTicketCode(generateTicketCode());
        ticket.setType(type != null ? type : "UNLOCK");
        ticket.setStatus("SUBMITTED");
        ticket.setCustomerId(customerProfileId);
        ticket.setFacilityId(facilityId);
        ticket.setUnitCode(unitCode);
        ticket.setContractId(activeContract.getContractId());
        if ("EARLY_TERMINATION".equalsIgnoreCase(type)) {
            List<SupportTicket> existingTickets = supportTicketRepository.findByContractId(activeContract.getContractId());
            for (SupportTicket existing : existingTickets) {
                if ("EARLY_TERMINATION".equalsIgnoreCase(existing.getType()) &&
                    ("SUBMITTED".equalsIgnoreCase(existing.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existing.getStatus()))) {
                    throw new IllegalArgumentException("Hợp đồng ô kho " + unitCode + " đang có yêu cầu trả kho sớm đang chờ xử lý (#" + existing.getTicketCode() + "). Không thể gửi thêm yêu cầu mới!");
                }
            }
            if (desiredDate == null) {
                throw new IllegalArgumentException("Vui lòng chọn ngày hẹn trả kho (phải hẹn trước ít nhất 1 ngày)!");
            }
            LocalDate minDate = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(1);
            if (desiredDate.isBefore(minDate)) {
                throw new IllegalArgumentException("Ngày hẹn trả kho sớm phải báo trước ít nhất 1 ngày (sớm nhất là từ ngày mai " + minDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ").");
            }
            ticket.setTitle("Yêu cầu trả kho sớm");
            ticket.setDesiredDate(desiredDate != null ? desiredDate : minDate);
            ticket.setSlaDeadline(null);
            activeContract.setCancelReason("EARLY_TERMINATION");
            contractRepository.save(activeContract);
        } else {
            String typeLabel = "Yêu cầu hỗ trợ";
            if ("UNLOCK".equalsIgnoreCase(type)) {
                typeLabel = "Mở khóa khẩn cấp";
            } else if ("MAINTENANCE".equalsIgnoreCase(type)) {
                typeLabel = "Bảo trì / Sửa chữa";
            } else if ("INCIDENT".equalsIgnoreCase(type)) {
                typeLabel = "Báo sự cố an ninh & kỹ thuật";
            }
            ticket.setTitle(typeLabel);
            ticket.setSlaDeadline(LocalDateTime.now().plusMinutes(15));
        }
        ticket.setDescription(description != null ? description : "");
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setIsSlaBreached(false);
        ticket.setIdentityVerified(false);

        return "INCIDENT".equalsIgnoreCase(ticket.getType())
                ? saveIncidentWithAssignment(ticket, accountId)
                : logCreatedTicket(supportTicketRepository.save(ticket), accountId);
    }

    @Transactional
    public SupportTicket createSupportFormTicket(Integer accountId, String type, String unitCode, String description) {
        return createSupportFormTicket(accountId, type, unitCode, description, null);
    }

    private SupportTicket saveIncidentWithAssignment(SupportTicket ticket, Integer customerAccountId) {
        SupportTicket saved = supportTicketRepository.save(ticket);
        List<Integer> onDutyStaffIds = staffShiftService.getOnDutyStaffAccountIds(saved.getFacilityId());
        if (onDutyStaffIds.isEmpty()) {
            saved.setStatus("SUBMITTED");
            saved.setIsSlaBreached(false);
            saved = supportTicketRepository.save(saved);
            return logCreatedTicket(saved, customerAccountId);
        }

        Integer assigneeAccountId = onDutyStaffIds.stream()
                .min(Comparator
                        .comparingLong((Integer id) -> supportTicketRepository
                                .countByAssignedStaffIdAndStatusIn(id, List.of("SUBMITTED", "IN_PROGRESS")))
                        .thenComparingInt(Integer::intValue))
                .orElseThrow();
        saved.setAssignedStaffId(assigneeAccountId);
        return logCreatedTicket(supportTicketRepository.save(saved), customerAccountId);
    }

    private SupportTicket logCreatedTicket(SupportTicket ticket, Integer customerAccountId) {
        if (customerAccountId != null) {
            ActivityLog log = new ActivityLog();
            Integer resolvedAccountId = customerAccountId;
            Optional<Account> accOpt = accountRepository.findById(Long.valueOf(customerAccountId));
            if (accOpt.isEmpty() || !Long.valueOf(5L).equals(accOpt.get().getRoleId())) {
                if (ticket.getContractId() != null) {
                    resolvedAccountId = contractRepository.findById(ticket.getContractId())
                            .map(Contract::getReservationId)
                            .flatMap(reservationRepository::findById)
                            .map(Reservation::getAccountId)
                            .orElse(resolvedAccountId);
                }
                if (Objects.equals(resolvedAccountId, customerAccountId) && ticket.getCustomerId() != null) {
                    resolvedAccountId = customerProfileRepository.findById(ticket.getCustomerId())
                            .map(CustomerProfile::getAccountId)
                            .orElse(resolvedAccountId);
                }
            }
            log.setAccountId(resolvedAccountId);
            log.setFacilityId(ticket.getFacilityId());
            log.setAction("CUSTOMER_TICKET_CREATED");
            log.setDescription("Khách tạo ticket " + ticket.getTicketCode() + " loại " + ticket.getType());
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        }
        return ticket;
    }

    public List<SupportTicket> getCustomerTickets(Integer accountOrCustomerId) {
        if (noShowCronService != null) {
            try {
                noShowCronService.processExpiredEarlyTerminationTickets();
            } catch (Exception ignored) {}
        }
        if (accountOrCustomerId == null) return Collections.emptyList();

        // Tham số đầu vào có thể là accountId hoặc customerId nên gom cả hai để không sót ticket
        Set<Integer> targetCustomerIds = new LinkedHashSet<>();
        targetCustomerIds.add(accountOrCustomerId);

        customerProfileRepository.findByAccountId(accountOrCustomerId)
                .ifPresent(cp -> targetCustomerIds.add(cp.getCustomerId()));

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

        populateTicketsExtraInfo(results);
        return results;
    }

    public void populateTicketsExtraInfo(List<SupportTicket> tickets) {
        if (tickets == null || tickets.isEmpty()) return;
        tickets.forEach(this::populateTicketExtraInfo);
    }

    public void populateTicketExtraInfo(SupportTicket t) {
        if (t == null) return;
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
                if (t.getCustomerName() == null) {
                    accountRepository.findById(Long.valueOf(t.getCustomerId())).ifPresent(acc -> {
                        t.setCustomerName(acc.getFullName());
                        t.setCustomerPhone(acc.getPhone());
                    });
                }
            } catch (Exception ignored) {}
        }
        if (t.getAssignedStaffId() != null) {
            try {
                accountRepository.findById(Long.valueOf(t.getAssignedStaffId())).ifPresent(acc -> {
                    t.setAssignedStaffName(acc.getFullName());
                });
            } catch (Exception ignored) {}
        }
        if (t.getFacilityId() != null && facilityRepository != null) {
            try {
                facilityRepository.findById(t.getFacilityId()).ifPresent(f -> {
                    t.setFacilityName(f.getFacilityName());
                });
            } catch (Exception ignored) {}
        }
        if (t.getContractId() != null && contractRepository != null) {
            try {
                contractRepository.findById(t.getContractId()).ifPresent(c -> {
                    if (c.getReservationId() != null && reservationRepository != null) {
                        reservationRepository.findById(c.getReservationId()).ifPresent(r -> {
                            String code = r.getReservationCode();
                            t.setContractCode(code != null && !code.isBlank() ? code : ("CTR-" + c.getContractId()));
                        });
                    }
                    if (t.getContractCode() == null) {
                        t.setContractCode("CTR-" + c.getContractId());
                    }
                });
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public List<SupportTicket> getStaffTickets(Integer staffAccountId, String status, String type) {
        if (noShowCronService != null) {
            try {
                noShowCronService.processExpiredEarlyTerminationTickets();
            } catch (Exception ignored) {}
        }
        Integer facilityId = staffShiftService.requireOnDutyFacility(staffAccountId);
        List<SupportTicket> tickets = supportTicketRepository.findByFacilityIdOrderByCreatedAtDesc(facilityId);

        populateTicketsExtraInfo(tickets);

        return tickets.stream()
                .filter(t -> status == null || status.trim().isEmpty() || "ALL".equalsIgnoreCase(status) || t.getStatus().equalsIgnoreCase(status))
                .filter(t -> type == null || type.trim().isEmpty() || "ALL".equalsIgnoreCase(type) || t.getType().equalsIgnoreCase(type))
                .collect(Collectors.toList());
    }

    @Transactional
    public SupportTicket acceptTicket(Long ticketId, Integer staffId) {
        Integer facilityId = staffShiftService.requireOnDutyFacility(staffId);
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ticket # " + ticketId));

        if (facilityId != null && ticket.getFacilityId() != null && !ticket.getFacilityId().equals(facilityId)) {
            throw new AccessDeniedException("Bạn không có quyền tiếp nhận ticket của cơ sở khác!");
        }
        if (ticket.getAssignedStaffId() != null && !ticket.getAssignedStaffId().equals(staffId)
                && staffShiftService.getOnDutyStaffAccountIds(facilityId).contains(ticket.getAssignedStaffId())) {
            throw new AccessDeniedException("Ticket này đã được gán cho nhân viên khác đang trực ca.");
        }

        if (!"SUBMITTED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Ticket này đã được tiếp nhận hoặc đã xử lý xong!");
        }

        if ("EARLY_TERMINATION".equalsIgnoreCase(ticket.getType()) && ticket.getDesiredDate() != null) {
            LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
            if (ticket.getDesiredDate().isAfter(today)) {
                String dStr = ticket.getDesiredDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                throw new IllegalArgumentException("Chưa đến ngày hẹn trả kho (" + dStr + "). Chỉ tiếp nhận vào đúng ngày hẹn!");
            }
        }

        ticket.setStatus("IN_PROGRESS");
        ticket.setAssignedStaffId(staffId);
        ticket.setAcceptedAt(LocalDateTime.now());
        SupportTicket saved = supportTicketRepository.save(ticket);
        populateTicketExtraInfo(saved);
        return saved;
    }

    public UnlockDetailResponse getUnlockDetails(Long ticketId, Integer staffAccountId) {
        Integer facilityId = staffShiftService.requireOnDutyFacility(staffAccountId);
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

    @Transactional
    public SupportTicket resolveUnlockTicket(Long ticketId, ResolveUnlockRequest req, Integer staffId) {
        Integer facilityId = staffShiftService.requireOnDutyFacility(staffId);
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ticket # " + ticketId));

        if (facilityId != null && ticket.getFacilityId() != null && !ticket.getFacilityId().equals(facilityId)) {
            throw new AccessDeniedException("Bạn không có quyền xử lý ticket của cơ sở khác!");
        }

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

        if (activityLogRepository != null && staffId != null) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(staffId);
            log.setFacilityId(ticket.getFacilityId());
            log.setAction("RESOLVE_UNLOCK_TICKET");
            log.setDescription(String.format("Nhân viên #%d xác nhận đối chiếu CCCD trùng khớp và mở khóa hộ ô %s (Ticket: %s)",
                    staffId, ticket.getUnitCode(), ticket.getTicketCode()));
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return saved;
    }

    @Transactional
    public SupportTicket resolveTicket(Long ticketId, String note, Integer staffId) {
        Integer facilityId = staffShiftService.requireOnDutyFacility(staffId);
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
            log.setFacilityId(ticket.getFacilityId());
            log.setAction("RESOLVE_TICKET");
            log.setDescription(String.format("Nhân viên #%d đã xử lý hoàn tất ticket %s: %s",
                    staffId, ticket.getTicketCode(), ticket.getResolutionNote()));
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        }

        populateTicketExtraInfo(saved);
        return saved;
    }

    @Transactional
    public List<SupportTicket> getManagerTickets(Integer facilityId, String status, String type) {
        if (noShowCronService != null) {
            try {
                noShowCronService.processExpiredEarlyTerminationTickets();
            } catch (Exception ignored) {}
        }
        List<SupportTicket> tickets;
        if (facilityId == null || facilityId <= 0) {
            tickets = supportTicketRepository.findAllByOrderByCreatedAtDesc();
        } else {
            tickets = supportTicketRepository.findByFacilityIdOrderByCreatedAtDesc(facilityId);
        }

        populateTicketsExtraInfo(tickets);

        return tickets.stream()
                .filter(t -> status == null || status.trim().isEmpty() || "ALL".equalsIgnoreCase(status) || t.getStatus().equalsIgnoreCase(status))
                .filter(t -> type == null || type.trim().isEmpty() || "ALL".equalsIgnoreCase(type) || t.getType().equalsIgnoreCase(type))
                .sorted((a, b) -> {
                    int pA = getStatusPriority(a.getStatus());
                    int pB = getStatusPriority(b.getStatus());
                    if (pA != pB) {
                        return Integer.compare(pA, pB);
                    }
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    private int getStatusPriority(String status) {
        if ("SUBMITTED".equalsIgnoreCase(status)) return 1;
        if ("IN_PROGRESS".equalsIgnoreCase(status)) return 2;
        if ("RESOLVED".equalsIgnoreCase(status)) return 3;
        return 4;
    }
}
