package com.swp391.backend.controller;

import com.swp391.backend.dto.CustomerNotificationResponse;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.repository.ActivityLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/customer")
public class CustomerPortalDataController {

    private final ActivityLogRepository activityLogRepository;

    public CustomerPortalDataController(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<CustomerNotificationResponse>> getCustomerNotifications(
            @AuthenticationPrincipal Integer accountId) {
        if (accountId == null) {
            return ResponseEntity.status(401).build();
        }

        List<ActivityLog> logs = activityLogRepository.findByAccountIdOrderByCreatedAtDesc(accountId);
        List<CustomerNotificationResponse> list = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

        for (ActivityLog log : logs) {
            String action = log.getAction() != null ? log.getAction() : "";
                        String timeStr = log.getCreatedAt() != null ? log.getCreatedAt().format(formatter) : "";

            if ("LOGIN_SUCCESS".equalsIgnoreCase(action)) {
                list.add(new CustomerNotificationResponse(
                        "act-" + log.getActivityLogId(),
                        "Đăng nhập thành công",
                        "Đăng nhập hệ thống lúc " + timeStr,
                        "INFO",
                        log.getCreatedAt(),
                        false,
                        "/profile"
                ));
            } else if ("LOGIN_FAILED".equalsIgnoreCase(action)) {
                list.add(new CustomerNotificationResponse(
                        "act-" + log.getActivityLogId(),
                        "Cảnh báo đăng nhập sai mật khẩu",
                        "Phát hiện lần thử đăng nhập không thành công lúc " + timeStr,
                        "WARNING",
                        log.getCreatedAt(),
                        false,
                        "/profile"
                ));
            } else if (action.toUpperCase().contains("LOCK") || action.toUpperCase().contains("SUSPEND")) {
                list.add(new CustomerNotificationResponse(
                        "act-" + log.getActivityLogId(),
                        "Cảnh báo tài khoản tạm khóa",
                        "Tài khoản bị tạm khóa vì lý do an toàn lúc " + timeStr,
                        "WARNING",
                        log.getCreatedAt(),
                        false,
                        "/profile"
                ));
            } else if (action.toUpperCase().contains("PASSWORD") || action.toUpperCase().contains("RESET")) {
                list.add(new CustomerNotificationResponse(
                        "act-" + log.getActivityLogId(),
                        "Bảo mật: Đổi mật khẩu",
                        "Mật khẩu tài khoản đã được thay đổi lúc " + timeStr,
                        "INFO",
                        log.getCreatedAt(),
                        false,
                        "/profile"
                ));
            }
        }

        // Giới hạn 20 thông báo gần nhất
        if (list.size() > 20) {
            list = list.subList(0, 20);
        }

        return ResponseEntity.ok(list);
    }
}
