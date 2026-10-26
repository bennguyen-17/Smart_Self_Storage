package com.swp391.backend.controller;

import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.SystemPolicy;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.SystemPolicyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/bom/policies")
public class BomPolicyController {

    private final SystemPolicyRepository policyRepository;
    private final ActivityLogRepository activityLogRepository;

    private static final Map<String, String[]> DEFAULT_POLICIES = new LinkedHashMap<>();

    static {
        DEFAULT_POLICIES.put("DEPOSIT_RATE", new String[]{"0.3", "Tỷ lệ tiền đặt cọc giữ chỗ (30% giá thuê)"});
        DEFAULT_POLICIES.put("DAILY_OVERDUE_FEE", new String[]{"50000", "Phí phạt trễ hạn trả kho mỗi ngày (50.000 VNĐ/ngày)"});
        DEFAULT_POLICIES.put("OVERDUE_LIQUIDATION_DAYS", new String[]{"30", "Thời hạn tối đa quá hạn trước khi tiến hành thanh lý (30 ngày)"});
        DEFAULT_POLICIES.put("REFUND_EARLY_CANCEL_RATE", new String[]{"1.0", "Tỷ lệ hoàn cọc khi hủy trước 24h giờ nhận kho (100%)"});
        DEFAULT_POLICIES.put("REFUND_LATE_CANCEL_RATE", new String[]{"0.5", "Tỷ lệ hoàn cọc khi hủy trong vòng 24h giờ nhận kho (50%)"});
        DEFAULT_POLICIES.put("MAX_FAILED_LOGIN_ATTEMPTS", new String[]{"5", "Số lần đăng nhập sai tối đa trước khi tạm khóa (5 lần)"});
        DEFAULT_POLICIES.put("ACCOUNT_LOCK_MINUTES", new String[]{"15", "Thời gian tạm khóa tài khoản do sai mật khẩu (15 phút)"});
    }

    public BomPolicyController(SystemPolicyRepository policyRepository,
                               ActivityLogRepository activityLogRepository) {
        this.policyRepository = policyRepository;
        this.activityLogRepository = activityLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<SystemPolicy>> getPolicies() {
        List<SystemPolicy> current = policyRepository.findAll();
        if (current.isEmpty()) {
            List<SystemPolicy> defaults = new ArrayList<>();
            for (Map.Entry<String, String[]> entry : DEFAULT_POLICIES.entrySet()) {
                defaults.add(new SystemPolicy(entry.getKey(), entry.getValue()[0], entry.getValue()[1], null));
            }
            current = policyRepository.saveAll(defaults);
        }
        return ResponseEntity.ok(current);
    }

    @PutMapping
    public ResponseEntity<?> updatePolicies(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal Integer accountId) {

        List<SystemPolicy> updatedList = new ArrayList<>();
        StringBuilder logDesc = new StringBuilder("BOM cập nhật chính sách hệ thống: ");

        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String key = entry.getKey().trim();
            String val = entry.getValue() != null ? entry.getValue().toString().trim() : "";

            SystemPolicy policy = policyRepository.findById(key).orElseGet(() -> {
                String desc = DEFAULT_POLICIES.containsKey(key) ? DEFAULT_POLICIES.get(key)[1] : "Chính sách hệ thống " + key;
                return new SystemPolicy(key, val, desc, accountId);
            });

            policy.setPolicyValue(val);
            policy.setUpdatedAt(LocalDateTime.now());
            policy.setUpdatedBy(accountId);
            updatedList.add(policy);

            logDesc.append("[").append(key).append("=").append(val).append("] ");
        }

        List<SystemPolicy> saved = policyRepository.saveAll(updatedList);

        try {
            ActivityLog log = new ActivityLog();
            log.setAccountId(accountId != null ? accountId : 1);
            log.setAction("BOM_UPDATE_POLICIES");
            log.setDescription(logDesc.toString());
            log.setCreatedAt(LocalDateTime.now());
            activityLogRepository.save(log);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(saved);
    }
}
