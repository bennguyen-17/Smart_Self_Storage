package com.swp391.backend.service;

import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.repository.EmployeeProfileRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Service đảm bảo quy tắc BR-06: Phân quyền dữ liệu theo cơ sở (Facility Data Isolation).
 * Nhân viên / Quản lý cơ sở nào chỉ xem và thao tác dữ liệu cơ sở đó.
 */
@Service
public class EmployeeSecurityService {

    private final EmployeeProfileRepository employeeProfileRepository;

    public EmployeeSecurityService(EmployeeProfileRepository employeeProfileRepository) {
        this.employeeProfileRepository = employeeProfileRepository;
    }

    public Integer getAuthenticatedAccountId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Integer) {
            return (Integer) authentication.getPrincipal();
        }
        return null;
    }

    /**
     * Lấy facilityId hợp lệ của tài khoản nội bộ.
     * Chống việc sửa đổi header X-Facility-Id để xem/sửa dữ liệu cơ sở khác.
     */
    public Integer resolveFacilityId(Authentication authentication, Integer requestedFacilityId) {
        Integer accountId = getAuthenticatedAccountId(authentication);
        if (accountId == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để truy cập tài nguyên!");
        }

        // BOM và ADMIN có quyền xem toàn chuỗi (BR-06)
        boolean isAllAccess = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_BOM"));
        if (isAllAccess) {
            return requestedFacilityId;
        }

        EmployeeProfile profile = employeeProfileRepository.findByAccountId(accountId).orElse(null);
        if (profile == null || profile.getFacilityId() == null) {
            throw new AccessDeniedException("Tài khoản chưa được phân công cơ sở làm việc!");
        }

        Integer assignedFacilityId = profile.getFacilityId();
        if (requestedFacilityId != null && !requestedFacilityId.equals(assignedFacilityId)) {
            throw new AccessDeniedException("Bạn không có quyền xem hoặc thao tác dữ liệu của cơ sở khác (Quy chuẩn BR-06)!");
        }

        return assignedFacilityId;
    }
}
