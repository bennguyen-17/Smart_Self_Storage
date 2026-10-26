package com.swp391.backend.config;

import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.repository.EmployeeProfileRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SecurityContextHelper {

    private final EmployeeProfileRepository employeeProfileRepository;

    public SecurityContextHelper(EmployeeProfileRepository employeeProfileRepository) {
        this.employeeProfileRepository = employeeProfileRepository;
    }

    public Integer getCurrentAccountId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Integer) {
            return (Integer) auth.getPrincipal();
        }
        return null;
    }

    /**
     * Lấy FacilityId của tài khoản đang đăng nhập từ Database/EmployeeProfile.
     * Tuyệt đối không phụ thuộc hay tin tưởng Header do client tự gửi lên.
     * Nếu có fallbackHeaderFacilityId (cho môi trường test/dev), chỉ dùng khi accountId chưa gán.
     */
    public Integer requireCurrentFacilityId(Integer accountId, Integer fallbackHeaderFacilityId) {
        Integer accId = accountId != null ? accountId : getCurrentAccountId();
        if (accId != null) {
            Optional<EmployeeProfile> ep = employeeProfileRepository.findByAccountId(accId);
            if (ep.isPresent() && ep.get().getFacilityId() != null) {
                return ep.get().getFacilityId();
            }
        }
        if (fallbackHeaderFacilityId != null) {
            return fallbackHeaderFacilityId;
        }
        throw new AccessDeniedException("Tài khoản chưa được phân công quản lý cơ sở nào!");
    }

    public Integer requireCurrentFacilityId(Integer accountId) {
        return requireCurrentFacilityId(accountId, null);
    }
}
