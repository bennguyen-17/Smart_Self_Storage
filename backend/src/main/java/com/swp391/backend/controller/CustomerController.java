package com.swp391.backend.controller;

import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.swp391.backend.dto.ApiResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.CustomerProfile;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.CustomerProfileRepository;
import com.swp391.backend.service.EmailService;
import com.swp391.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/customers/profile")
public class CustomerController {

    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final ActivityLogRepository activityLogRepository;

    public CustomerController(AccountRepository accountRepository, 
                              CustomerProfileRepository customerProfileRepository, 
                              JwtService jwtService,
                              EmailService emailService,
                              ReservationRepository reservationRepository,
                              ContractRepository contractRepository,
                              PaymentRepository paymentRepository,
                              ActivityLogRepository activityLogRepository) {
        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
        this.paymentRepository = paymentRepository;
        this.activityLogRepository = activityLogRepository;
    }

    private Account resolveAccount(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            String token = authHeader.substring(7);
            Claims claims = jwtService.validateTokenAndGetClaims(token);
            Object userIdObj = claims.get("userId");
            Long targetId = null;
            if (userIdObj instanceof Number) {
                targetId = ((Number) userIdObj).longValue();
            } else if (userIdObj != null) {
                targetId = Long.parseLong(userIdObj.toString());
            }
            if (targetId != null) {
                return accountRepository.findById(targetId).orElse(null);
            }
        } catch (Exception e) {
            // Token parse error
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Account account = resolveAccount(authHeader);

        if (account == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Vui lòng đăng nhập để xem thông tin hồ sơ."));
        }

        // Fetch CustomerProfile from Database
        Optional<CustomerProfile> profileOpt = customerProfileRepository.findByAccountId(account.getAccountId());
        String identityNumber = profileOpt.map(CustomerProfile::getIdentityNumber).orElse(null);

        if (identityNumber == null || identityNumber.trim().isEmpty()) {
            identityNumber = "Chưa cập nhật";
        }

        Map<String, Object> data = new HashMap<>();
        data.put("customerId", account.getAccountId());
        data.put("accountId", account.getAccountId());
        data.put("fullName", account.getFullName());
        data.put("phone", account.getPhone());
        data.put("email", account.getEmail() != null ? account.getEmail() : account.getPhone() + "@smartstorage.vn");
        boolean isActive = "ACTIVE".equalsIgnoreCase(account.getStatus());
        data.put("status", account.getStatus());
        data.put("identityNumber", identityNumber);
        data.put("bankName", profileOpt.map(CustomerProfile::getBankName).orElse("Chưa cập nhật"));
        data.put("bankAccountNumber", profileOpt.map(CustomerProfile::getBankAccountNumber).orElse("Chưa cập nhật"));
        data.put("bankAccountName", profileOpt.map(CustomerProfile::getBankAccountName).orElse("Chưa cập nhật"));
        data.put("isVerified", isActive);
        data.put("verificationBadge", isActive ? "ĐÃ XÁC THỰC THÔNG TIN" : "CHƯA XÁC THỰC THÔNG TIN");
        data.put("deletionScheduledAt", account.getDeletionScheduledAt());

        return ResponseEntity.ok(data);
    }

    @PostMapping("/send-email-otp")
    public ResponseEntity<ApiResponse> sendEmailOtp(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> request) {
        
        Account account = resolveAccount(authHeader);
        if (account == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Vui lòng đăng nhập."));
        }

        String newEmail = request.get("newEmail") != null ? request.get("newEmail").toString().trim().toLowerCase() : null;
        if (newEmail == null || !newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Địa chỉ email mới không hợp lệ."));
        }

        // Check if email already used by another account
        Optional<Account> existing = accountRepository.findByEmail(newEmail);
        if (existing.isPresent() && !existing.get().getAccountId().equals(account.getAccountId())) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Email này đã được sử dụng bởi một tài khoản khác."));
        }

        // Sinh mã OTP 6 số
        String otpCode = String.format("%06d", new Random().nextInt(1_000_000));
        account.setOtpCode(otpCode);
        account.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        accountRepository.save(account);

        // Gửi email OTP tới Email MỚI
        boolean emailSent = emailService.sendOtpEmail(newEmail, account.getFullName(), otpCode, "Cập nhật Email mới");
        String message = emailSent 
                ? "Mã OTP đã được gửi đến email " + newEmail + ". Vui lòng kiểm tra hộp thư!"
                : "Mã OTP đã được tạo (Mã thử nghiệm: " + otpCode + "). Vui lòng nhập để xác nhận!";

        return ResponseEntity.ok(new ApiResponse(true, message));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> updateData) {
        
        Account account = resolveAccount(authHeader);
        if (account == null) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Vui lòng đăng nhập."));
        }

        // 1. Họ và tên
        if (updateData.containsKey("fullName") && updateData.get("fullName") != null) {
            String fullName = updateData.get("fullName").toString().trim();
            if (!fullName.isEmpty()) {
                account.setFullName(fullName);
            }
        }

        // 2. Số điện thoại (Kiểm tra định dạng và trùng lặp)
        if (updateData.containsKey("phone") && updateData.get("phone") != null) {
            String newPhone = updateData.get("phone").toString().trim();
            if (!newPhone.matches("^0[0-9]{9}$")) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0."));
            }
            if (!newPhone.equals(account.getPhone())) {
                Optional<Account> phoneOwner = accountRepository.findByPhone(newPhone);
                if (phoneOwner.isPresent() && !phoneOwner.get().getAccountId().equals(account.getAccountId())) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "Số điện thoại này đã được sử dụng bởi tài khoản khác."));
                }
                account.setPhone(newPhone);
            }
        }

        // 3. Email (Nếu có thay đổi, bắt buộc phải có OTP hợp lệ)
        if (updateData.containsKey("email") && updateData.get("email") != null) {
            String newEmail = updateData.get("email").toString().trim().toLowerCase();
            String currentEmail = account.getEmail() != null ? account.getEmail().trim().toLowerCase() : "";

            if (!newEmail.equals(currentEmail)) {
                if (!newEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "Địa chỉ email mới không hợp lệ."));
                }
                Optional<Account> emailOwner = accountRepository.findByEmail(newEmail);
                if (emailOwner.isPresent() && !emailOwner.get().getAccountId().equals(account.getAccountId())) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "Email này đã được sử dụng bởi tài khoản khác."));
                }

                String otpCode = updateData.containsKey("otpCode") && updateData.get("otpCode") != null 
                        ? updateData.get("otpCode").toString().trim() : "";
                
                if (otpCode.isEmpty()) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "Vui lòng nhập mã OTP xác thực email gửi đến hòm thư mới."));
                }

                if (account.getOtpCode() == null || !account.getOtpCode().equals(otpCode)) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "Mã OTP xác thực không chính xác."));
                }
                if (account.getOtpExpiryTime() != null && account.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "Mã OTP đã hết hạn (hiệu lực 5 phút). Vui lòng yêu cầu mã mới."));
                }

                account.setEmail(newEmail);
                account.setOtpCode(null);
                account.setOtpExpiryTime(null);
            }
        }

        accountRepository.save(account);

        // Fetch or create CustomerProfile from Database
        Optional<CustomerProfile> profileOpt = customerProfileRepository.findByAccountId(account.getAccountId());
        CustomerProfile profile = profileOpt.orElseGet(() -> new CustomerProfile(account.getAccountId(), "Chưa cập nhật"));
        if (updateData.containsKey("bankName")) {
            profile.setBankName(updateData.get("bankName") != null ? updateData.get("bankName").toString().trim() : null);
        }
        if (updateData.containsKey("bankAccountNumber")) {
            profile.setBankAccountNumber(updateData.get("bankAccountNumber") != null ? updateData.get("bankAccountNumber").toString().trim() : null);
        }
        if (updateData.containsKey("bankAccountName")) {
            profile.setBankAccountName(updateData.get("bankAccountName") != null ? updateData.get("bankAccountName").toString().trim().toUpperCase() : null);
        }
        customerProfileRepository.save(profile);
        String identityNumber = profile.getIdentityNumber() != null ? profile.getIdentityNumber() : "Chưa cập nhật";

        Map<String, Object> data = new HashMap<>();
        data.put("customerId", account.getAccountId());
        data.put("accountId", account.getAccountId());
        data.put("fullName", account.getFullName());
        data.put("phone", account.getPhone());
        data.put("email", account.getEmail());
        data.put("status", account.getStatus());
        data.put("identityNumber", identityNumber);
        data.put("bankName", profile.getBankName() != null ? profile.getBankName() : "Chưa cập nhật");
        data.put("bankAccountNumber", profile.getBankAccountNumber() != null ? profile.getBankAccountNumber() : "Chưa cập nhật");
        data.put("bankAccountName", profile.getBankAccountName() != null ? profile.getBankAccountName() : "Chưa cập nhật");
        data.put("isVerified", "ACTIVE".equalsIgnoreCase(account.getStatus()));
        data.put("verificationBadge", "ACTIVE".equalsIgnoreCase(account.getStatus()) ? "ĐÃ XÁC THỰC THÔNG TIN" : "CHƯA XÁC THỰC THÔNG TIN");
        data.put("deletionScheduledAt", account.getDeletionScheduledAt());

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Cập nhật hồ sơ thành công!");
        resp.put("data", data);

        return ResponseEntity.ok(resp);
    }

    @PostMapping("/request-deletion")
    public ResponseEntity<?> requestAccountDeletion(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Account account = resolveAccount(authHeader);
        if (account == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập."));
        }

        // 1. Kiểm tra ràng buộc hợp đồng còn hiệu lực / chưa thanh lý / chưa hoàn cọc
        List<Reservation> reservations = reservationRepository.findByAccountId(account.getAccountId());
        List<Integer> resIds = reservations.stream().map(Reservation::getReservationId).toList();
        if (!resIds.isEmpty()) {
            List<Contract> contracts = contractRepository.findAll().stream()
                    .filter(c -> c.getReservationId() != null && resIds.contains(c.getReservationId()))
                    .toList();

            List<String> activeStatuses = List.of("INITIATED", "PENDING_CHECKIN", "ACTIVE", "OVERDUE", "TERMINATED");
            List<Contract> pendingContracts = contracts.stream()
                    .filter(c -> c.getStatus() != null && activeStatuses.contains(c.getStatus().toUpperCase()))
                    .toList();

            if (!pendingContracts.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Không thể xóa tài khoản: Bạn còn " + pendingContracts.size() + " hợp đồng đang hiệu lực, quá hạn hoặc đang chờ hoàn tất thủ tục trả kho / hoàn cọc. Vui lòng hoàn tất trả kho và nhận hoàn cọc trước khi yêu cầu xóa tài khoản."
                ));
            }

            // 2. Kiểm tra hóa đơn chưa thanh toán (UNPAID)
            List<Integer> contractIds = contracts.stream().map(Contract::getContractId).toList();
            if (!contractIds.isEmpty()) {
                List<Payment> unpaidPayments = paymentRepository.findAll().stream()
                        .filter(p -> p.getContractId() != null && contractIds.contains(p.getContractId()))
                        .filter(p -> "UNPAID".equalsIgnoreCase(p.getStatus()) || ("PENDING".equalsIgnoreCase(p.getPaymentStatus()) && !"REF".equalsIgnoreCase(p.getInvoiceType())))
                        .filter(p -> p.getRemainingAmount() != null && p.getRemainingAmount().compareTo(BigDecimal.ZERO) > 0)
                        .toList();

                if (!unpaidPayments.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "message", "Không thể xóa tài khoản: Bạn còn " + unpaidPayments.size() + " khoản hóa đơn chưa thanh toán. Vui lòng thanh toán hết công nợ trước khi yêu cầu xóa tài khoản."
                    ));
                }
            }
        }

        LocalDateTime scheduledAt = LocalDateTime.now().plusDays(30);
        account.setDeletionScheduledAt(scheduledAt);
        accountRepository.save(account);

        ActivityLog log = new ActivityLog();
        log.setAccountId(account.getAccountId());
        log.setAction("ACCOUNT_DELETION_REQUESTED");
        log.setDescription("Khách hàng #" + account.getAccountId() + " (" + account.getFullName() + ") đã yêu cầu xóa tài khoản. Thời gian ân hạn đến: " + scheduledAt);
        log.setCreatedAt(LocalDateTime.now());
        activityLogRepository.save(log);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Yêu cầu xóa tài khoản đã được ghi nhận. Tài khoản của bạn sẽ được xóa vĩnh viễn vào ngày " + scheduledAt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + " (thời gian ân hạn 30 ngày). Bạn có thể đăng nhập lại trong thời gian này để hủy yêu cầu.",
                "deletionScheduledAt", scheduledAt
        ));
    }

    @PostMapping("/cancel-deletion")
    public ResponseEntity<?> cancelAccountDeletion(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Account account = resolveAccount(authHeader);
        if (account == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Vui lòng đăng nhập."));
        }

        if (account.getDeletionScheduledAt() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Tài khoản của bạn hiện không có yêu cầu xóa nào."
            ));
        }

        account.setDeletionScheduledAt(null);
        accountRepository.save(account);

        ActivityLog log = new ActivityLog();
        log.setAccountId(account.getAccountId());
        log.setAction("ACCOUNT_DELETION_CANCELLED");
        log.setDescription("Khách hàng #" + account.getAccountId() + " (" + account.getFullName() + ") đã hủy yêu cầu xóa tài khoản, tiếp tục sử dụng hệ thống.");
        log.setCreatedAt(LocalDateTime.now());
        activityLogRepository.save(log);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã hủy yêu cầu xóa tài khoản thành công! Bạn có thể tiếp tục sử dụng dịch vụ bình thường."
        ));
    }
}
