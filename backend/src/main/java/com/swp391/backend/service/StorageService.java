package com.swp391.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.FacilityRequest;
import com.swp391.backend.dto.FacilityResponse;
import com.swp391.backend.dto.PriceDto;
import com.swp391.backend.dto.UnitDetailResponse;
import com.swp391.backend.entity.Account;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Facility;
import com.swp391.backend.entity.FeePolicy;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Price;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.entity.UnitType;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.FeePolicyRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.PriceRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import com.swp391.backend.repository.UnitTypeRepository;

@Service
public class StorageService {

    private final FacilityRepository facilityRepository;
    private final FloorRepository floorRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final PriceRepository priceRepository;
    private final ActivityLogRepository activityLogRepository;

    private final FeePolicyRepository feePolicyRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final AccountRepository accountRepository;

    private BigDecimal getDiscountRate(String code, BigDecimal defaultRate) {
        try {
            if (feePolicyRepository != null) {
                Optional<FeePolicy> fp = feePolicyRepository.findByPolicyCode(code);
                if (fp.isPresent() && fp.get().getFeeValue() != null) {
                    return fp.get().getFeeValue();
                }
            }
        } catch (Exception ignored) {}
        return defaultRate;
    }

    public StorageService(FacilityRepository facilityRepository,
            FloorRepository floorRepository,
            UnitTypeRepository unitTypeRepository,
            StorageUnitRepository storageUnitRepository,
            PriceRepository priceRepository,
                          ActivityLogRepository activityLogRepository,
                          FeePolicyRepository feePolicyRepository,
                          EmployeeProfileRepository employeeProfileRepository,
                          AccountRepository accountRepository) {
        this.facilityRepository = facilityRepository;
        this.floorRepository = floorRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.priceRepository = priceRepository;
        this.activityLogRepository = activityLogRepository;
        this.feePolicyRepository = feePolicyRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.accountRepository = accountRepository;
    }

    //Lấy danh sách Cơ sở kèm mã code, shortCode và layout
    public List<FacilityResponse> getAllActiveFacilities() {
        return facilityRepository.findAll().stream()
                .map(this::mapFacilityToResponse)
                .collect(Collectors.toList());
    }

    public Optional<FacilityResponse> getFacilityById(Integer facilityId) {
        return facilityRepository.findById(facilityId).map(this::mapFacilityToResponse);
    }

    //Lấy danh sách Tầng theo Cơ sở
    public List<Floor> getFloorsByFacilityId(Integer facilityId) {
        return floorRepository.findByFacilityIdAndStatus(facilityId, "ACTIVE");
    }

    //Lấy danh sách Ô kho theo Tầng (kèm unitCode, kích thước, tải trọng, giá)
    public List<UnitDetailResponse> getUnitsByFloorId(Integer floorId) {
        List<StorageUnit> units = storageUnitRepository.findByFloorId(floorId);
        return mapToUnitDetailResponses(units);
    }

    //Bộ lọc Ô kho
    public List<UnitDetailResponse> filterUnits(Integer facilityId, Integer floorId, Integer unitTypeId, String storageCondition, String status) {
        List<StorageUnit> allUnits;

        if (facilityId != null && floorId != null) {
            Optional<Floor> directFloor = floorRepository.findById(floorId);
            if (directFloor.isPresent() && directFloor.get().getFacilityId().equals(facilityId)) {
                allUnits = storageUnitRepository.findByFloorId(floorId);
            } else {
                List<Floor> facilityFloors = floorRepository.findByFacilityId(facilityId);
                if (floorId <= facilityFloors.size() && floorId > 0) {
                    Integer actualFloorId = facilityFloors.get(floorId - 1).getFloorId();
                    allUnits = storageUnitRepository.findByFloorId(actualFloorId);
                } else {
                    allUnits = java.util.Collections.emptyList();
                }
            }
        } else if (floorId != null) {
            allUnits = storageUnitRepository.findByFloorId(floorId);
        } else if (facilityId != null) {
            List<Floor> floors = floorRepository.findByFacilityId(facilityId);
            allUnits = floors.stream()
                    .flatMap(f -> storageUnitRepository.findByFloorId(f.getFloorId()).stream())
                    .collect(Collectors.toList());
        } else {
            allUnits = storageUnitRepository.findAll();
        }

        Map<Integer, UnitType> unitTypeMap = unitTypeRepository.findAll().stream()
                .collect(Collectors.toMap(UnitType::getUnitTypeId, ut -> ut));

        return allUnits.stream()
                .filter(u -> status == null || status.trim().isEmpty() || u.getStatus().equalsIgnoreCase(status))
                .filter(u -> unitTypeId == null || u.getUnitTypeId().equals(unitTypeId))
                .filter(u -> {
                    if (storageCondition == null || storageCondition.trim().isEmpty()) {
                        return true;
                    }
                    UnitType ut = unitTypeMap.get(u.getUnitTypeId());
                    return ut != null && ut.getStorageCondition().equalsIgnoreCase(storageCondition);
                })
                .map(this::mapSingleUnit)
                .collect(Collectors.toList());
    }

    //Tính giá thuê và tiền cọc tự động
    public CalculatePriceResponse calculateRentalPrice(CalculatePriceRequest request) {
        if (request.getUnitTypeId() == null) {
            return CalculatePriceResponse.error("Vui lòng chọn loại kho !");
        }

        Optional<Price> priceOpt = priceRepository.findByUnitTypeIdAndStatus(request.getUnitTypeId(), "ACTIVE");
        if (priceOpt.isEmpty()) {
            return CalculatePriceResponse.error("Không tìm thấy bảng giá áp dụng cho loại kho này!");
        }

        Optional<UnitType> unitTypeOpt = unitTypeRepository.findById(request.getUnitTypeId());
        if (unitTypeOpt.isEmpty()) {
            return CalculatePriceResponse.error("Không tìm thấy thông tin loại kho!");
        }

        Price price = priceOpt.get();
        UnitType unitType = unitTypeOpt.get();
        String rentalType = request.getRentalType() != null ? request.getRentalType().toUpperCase() : "MONTHLY";
        int duration = request.getDuration() != null ? request.getDuration() : 1;

        BigDecimal baseUnitPrice;
        BigDecimal baseTotal;
        BigDecimal discountPercent = BigDecimal.ZERO;

        if ("DAILY".equals(rentalType)) {
            if (duration < 7) {
                return CalculatePriceResponse.error("Thời hạn thuê theo ngày tối thiểu là 7 ngày!");
            }
            baseUnitPrice = price.getDailyPrice();
            baseTotal = baseUnitPrice.multiply(BigDecimal.valueOf(duration));
            discountPercent = BigDecimal.ZERO;
        } else {
            // MONTHLY
            if (duration < 1) {
                return CalculatePriceResponse.error("Thời hạn thuê theo tháng tối thiểu là 1 tháng!");
            }
            baseUnitPrice = price.getMonthlyPrice();
            baseTotal = baseUnitPrice.multiply(BigDecimal.valueOf(duration));

            // Chiết khấu gói tháng
            if (duration >= 12) {
                discountPercent = getDiscountRate("DISCOUNT_12M", BigDecimal.valueOf(15));
            } else if (duration >= 6) {
                discountPercent = getDiscountRate("DISCOUNT_6M", BigDecimal.valueOf(10));
            } else if (duration >= 3) {
                discountPercent = getDiscountRate("DISCOUNT_3M", BigDecimal.valueOf(5));
            }
        }

        BigDecimal discountAmount = baseTotal.multiply(discountPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Phụ phí kho mát (Climate Controlled +20%) nếu có
        BigDecimal climateSurchargeAmount = BigDecimal.ZERO;
        if ("CLIMATE_CONTROLLED".equalsIgnoreCase(unitType.getStorageCondition())) {
            BigDecimal surchargeRate = price.getClimateSurchargePercent() != null && price.getClimateSurchargePercent().compareTo(BigDecimal.ZERO) > 0
                    ? price.getClimateSurchargePercent()
                    : BigDecimal.valueOf(20);
            climateSurchargeAmount = baseTotal.multiply(surchargeRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        BigDecimal finalRentalAmount = baseTotal.subtract(discountAmount).add(climateSurchargeAmount);
        BigDecimal depositAmount = price.getDepositAmount();

        CalculatePriceResponse response = new CalculatePriceResponse();
        response.setSuccess(true);
        response.setMessage("Tính toán giá thuê thành công!");
        response.setUnitTypeId(request.getUnitTypeId());
        response.setRentalType(rentalType);
        response.setDuration(duration);
        response.setBaseUnitPrice(baseUnitPrice);
        response.setBaseTotalAmount(baseTotal);
        response.setDiscountPercent(discountPercent);
        response.setDiscountAmount(discountAmount);
        response.setClimateSurchargeAmount(climateSurchargeAmount);
        response.setFinalRentalAmount(finalRentalAmount);
        response.setDepositAmount(depositAmount);
        response.setTotalInitialPayment(depositAmount); // Đặt cọc 100% online

        return response;
    }

    public FacilityResponse mapFacilityToResponse(Facility f) {
        FacilityResponse res = new FacilityResponse();
        res.setFacilityId(f.getFacilityId());

        String rawName = f.getFacilityName() != null ? f.getFacilityName().trim() : "";
        if (rawName.contains("(") && rawName.contains(")")) {
            rawName = rawName.replaceAll("\\s*\\([^)]*\\)", "").trim();
        }
        res.setFacilityName(rawName);
        res.setAddress(f.getAddress());
        res.setPhone(f.getPhone());
        res.setStatus(f.getStatus());

        // Lấy mã cơ sở và layout chuẩn hóa trực tiếp từ entity
        String code = f.getFacilityCode();
        String layout = f.getLayoutType();

        if (code == null || code.trim().isEmpty()) {
            int facId = (f.getFacilityId() != null) ? f.getFacilityId() : 0;
            switch (facId) {
                case 1 -> { code = "HN01"; layout = "A"; }
                case 2 -> { code = "HN02"; layout = "B"; }
                case 3 -> { code = "HCM01"; layout = "A"; }
                case 4 -> { code = "HCM02"; layout = "B"; }
                case 5 -> { code = "HCM03"; layout = "B"; }
                case 6 -> { code = "DN01"; layout = "A"; }
                case 7 -> { code = "CT01"; layout = "B"; }
                default -> code = "FAC" + String.format("%02d", facId);
            }
        }
        if (layout == null || layout.trim().isEmpty()) {
            layout = "A";
        }

        code = code.replace("-", "").toUpperCase();
        res.setFacilityCode(code);
        res.setShortCode(code);
        res.setLayoutType(layout.toUpperCase());
        res.setIsAllClimate("HCM01".equalsIgnoreCase(code));

        List<Floor> actualFloors = floorRepository.findByFacilityId(f.getFacilityId());
        res.setFloorCount(actualFloors.isEmpty() ? 3 : actualFloors.size());

        if (f.getFacilityId() != null && employeeProfileRepository != null && accountRepository != null) {
            List<com.swp391.backend.entity.EmployeeProfile> emps = employeeProfileRepository.findByFacilityId(f.getFacilityId());
            for (com.swp391.backend.entity.EmployeeProfile ep : emps) {
                Optional<com.swp391.backend.entity.Account> accOpt = accountRepository.findAccountByAccountId(ep.getAccountId());
                if (accOpt.isPresent() 
                        && Long.valueOf(3L).equals(accOpt.get().getRoleId())
                        && "ACTIVE".equalsIgnoreCase(accOpt.get().getStatus())) {
                    com.swp391.backend.entity.Account acc = accOpt.get();
                    String name = acc.getFullName() != null ? acc.getFullName().trim() : "";
                    String cleanName = name.replaceAll("\\s*\\([^)]*\\)", "").trim();
                    res.setManagerName(cleanName.isEmpty() ? name : cleanName);
                    res.setManagerPhone(acc.getPhone());
                    res.setManagerEmail(acc.getEmail());
                    break;
                }
            }
        }

        return res;
    }

    // --- US-13: Lấy danh sách ô kho của cơ sở cho Facility Manager ---
    public List<UnitDetailResponse> getManagerUnits(Integer managerFacilityId, Integer floorId, String status, String size, String storageCondition) {
        if (managerFacilityId == null) {
            throw new AccessDeniedException("Vui lòng cung cấp mã cơ sở của Quản lý!");
        }
        return filterUnits(managerFacilityId, floorId, null, storageCondition, status);
    }

    // --- US-13: Cấu hình đổi loại kho (Thường <=> Điều hòa) kèm ghi log và check size ---
    @Transactional
    public StorageUnit changeUnitType(String unitCode, Integer newUnitTypeId, Integer managerFacilityId, Integer accountId) {
        StorageUnit unit = storageUnitRepository.findById(unitCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ô kho: " + unitCode));

        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new RuntimeException("Lỗi dữ liệu tầng của ô kho!"));

        if (managerFacilityId != null && !floor.getFacilityId().equals(managerFacilityId)) {
            throw new AccessDeniedException("Bạn không có quyền quản lý ô kho thuộc cơ sở này!");
        }

        if (!"AVAILABLE".equalsIgnoreCase(unit.getStatus())) {
            throw new RuntimeException("Chỉ được đổi loại kho khi ô đang trống (AVAILABLE)! Trạng thái hiện tại: " + unit.getStatus());
        }

        UnitType oldType = unitTypeRepository.findById(unit.getUnitTypeId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin loại kho cũ!"));
        UnitType newType = unitTypeRepository.findById(newUnitTypeId)
                .orElseThrow(() -> new RuntimeException("Loại kho mới không tồn tại!"));

        if (!oldType.getSize().equalsIgnoreCase(newType.getSize())) {
            throw new RuntimeException("Không thể thay đổi kích thước vật lý của ô kho (từ " + oldType.getSize() + " sang " + newType.getSize() + ")! Chỉ được chuyển đổi giữa Kho Thường và Kho Điều Hòa cùng Size.");
        }

        Integer oldTypeId = unit.getUnitTypeId();
        unit.setUnitTypeId(newUnitTypeId);
        StorageUnit saved = storageUnitRepository.save(unit);

        if (activityLogRepository != null && accountId != null) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(accountId);
            log.setFacilityId(floorRepository.findById(unit.getFloorId()).map(Floor::getFacilityId).orElse(null));
            log.setAction("CHANGE_UNIT_TYPE");
            log.setDescription("Đổi loại ô kho " + unitCode + " từ typeId " + oldTypeId + " sang " + newUnitTypeId);
            log.setCreatedAt(java.time.LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return saved;
    }

    // --- US-14: Đưa ô kho vào trạng thái bảo trì / dọn dẹp ---
    @Transactional
    public StorageUnit putUnderMaintenance(String unitCode, Integer managerFacilityId, Integer accountId) {
        return putUnderMaintenance(unitCode, managerFacilityId, accountId, null);
    }

    @Transactional
    public StorageUnit putUnderMaintenance(String unitCode, Integer managerFacilityId, Integer accountId, String note) {
        StorageUnit unit = storageUnitRepository.findById(unitCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ô kho: " + unitCode));

        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new RuntimeException("Lỗi dữ liệu tầng!"));

        if (managerFacilityId != null && !floor.getFacilityId().equals(managerFacilityId)) {
            throw new AccessDeniedException("Bạn không có quyền quản lý ô kho thuộc cơ sở này!");
        }

        if ("RENTED".equalsIgnoreCase(unit.getStatus()) || "RESERVED".equalsIgnoreCase(unit.getStatus()) || "HOLD".equalsIgnoreCase(unit.getStatus())) {
            throw new RuntimeException("Không thể đưa vào bảo trì khi ô kho đang có khách đặt hoặc đang thuê! Trạng thái: " + unit.getStatus());
        }

        unit.setStatus("MAINTENANCE");
        StorageUnit saved = storageUnitRepository.save(unit);

        if (activityLogRepository != null && accountId != null) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(accountId);
            log.setFacilityId(floor.getFacilityId());
            log.setAction("PUT_MAINTENANCE");
            String desc = "Đưa ô kho " + unitCode + " vào trạng thái bảo trì MAINTENANCE";
            if (note != null && !note.trim().isEmpty()) {
                desc += ". Ghi chú: " + note.trim();
            }
            log.setDescription(desc);
            log.setCreatedAt(java.time.LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return saved;
    }

    // --- US-14: Nghiệm thu hoàn tất dọn dẹp / bảo trì, đưa ô về AVAILABLE ---
    @Transactional
    public StorageUnit completeMaintenance(String unitCode, Integer staffFacilityId, Integer accountId) {
        StorageUnit unit = storageUnitRepository.findById(unitCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ô kho: " + unitCode));

        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new RuntimeException("Lỗi dữ liệu tầng!"));

        if (staffFacilityId != null && !floor.getFacilityId().equals(staffFacilityId)) {
            throw new AccessDeniedException("Bạn không có quyền quản lý ô kho thuộc cơ sở này!");
        }

        if (!"MAINTENANCE".equalsIgnoreCase(unit.getStatus())) {
            throw new RuntimeException("Chỉ có thể nghiệm thu ô kho đang ở trạng thái bảo trì (MAINTENANCE)! Trạng thái hiện tại: " + unit.getStatus());
        }

        unit.setStatus("AVAILABLE");
        StorageUnit saved = storageUnitRepository.save(unit);

        if (activityLogRepository != null && accountId != null) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(accountId);
            log.setFacilityId(floor.getFacilityId());
            log.setAction("COMPLETE_MAINTENANCE");
            log.setDescription("Nghiệm thu hoàn tất bảo trì, mở lại ô kho " + unitCode + " thành AVAILABLE");
            log.setCreatedAt(java.time.LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return saved;
    }

    // --- US-14: Lấy danh sách ô kho đang bảo trì của cơ sở ---
    public List<UnitDetailResponse> getMaintenanceUnits(Integer facilityId) {
        return filterUnits(facilityId, null, null, null, "MAINTENANCE");
    }

    private List<UnitDetailResponse> mapToUnitDetailResponses(List<StorageUnit> units) {
        return units.stream().map(this::mapSingleUnit).collect(Collectors.toList());
    }

    private UnitDetailResponse mapSingleUnit(StorageUnit u) {
        UnitDetailResponse dto = new UnitDetailResponse();
        dto.setUnitCode(u.getUnitCode());
        dto.setUnitId(u.getUnitCode());
        dto.setFloorId(u.getFloorId());
        dto.setUnitTypeId(u.getUnitTypeId());
        dto.setStatus(u.getStatus());

        // Lấy thông tin Tầng và Tải trọng sàn
        Optional<Floor> floorOpt = floorRepository.findById(u.getFloorId());
        if (floorOpt.isPresent()) {
            Floor fl = floorOpt.get();
            dto.setFloorName(fl.getFloorName());
            dto.setMaxLoadKgM2(fl.getMaxLoadPerM2() != null ? fl.getMaxLoadPerM2() : BigDecimal.valueOf(500));
        }

        // Lấy thông tin Loại kho và Kích thước chuẩn
        Optional<UnitType> unitTypeOpt = unitTypeRepository.findById(u.getUnitTypeId());
        if (unitTypeOpt.isPresent()) {
            UnitType ut = unitTypeOpt.get();
            dto.setTypeName(ut.getTypeName());
            dto.setSize(ut.getSize());
            dto.setStorageCondition(ut.getStorageCondition());
            dto.setIsClimate("CLIMATE_CONTROLLED".equalsIgnoreCase(ut.getStorageCondition()));

            // Gán kích thước chuẩn Dài x Rộng x Cao
            String lowerType = ut.getTypeName().toLowerCase();
            if (lowerType.contains("xl")) {
                dto.setLengthM(4.0);
                dto.setWidthM(2.5);
                dto.setHeightM(2.0);
                dto.setAreaM2(10.0);
            } else if (lowerType.contains("size s") || lowerType.startsWith("s ") || lowerType.equals("s")) {
                dto.setLengthM(1.0);
                dto.setWidthM(1.0);
                dto.setHeightM(2.0);
                dto.setAreaM2(1.0);
            } else if (lowerType.contains("size l") || lowerType.startsWith("l ") || lowerType.equals("l")) {
                dto.setLengthM(3.0);
                dto.setWidthM(2.0);
                dto.setHeightM(2.0);
                dto.setAreaM2(6.0);
            } else {
                dto.setLengthM(2.0);
                dto.setWidthM(1.5);
                dto.setHeightM(2.0);
                dto.setAreaM2(3.0);
            }
        }

        // Gán mã ô kho chuẩn từ Database (ví dụ: HN01-G-XL01)
        dto.setUnitCode(u.getUnitCode());

        // Lấy thông tin Bảng giá
        priceRepository.findByUnitTypeIdAndStatus(u.getUnitTypeId(), "ACTIVE").ifPresent(p -> {
            dto.setDailyPrice(p.getDailyPrice());
            dto.setMonthlyPrice(p.getMonthlyPrice());
            dto.setDepositAmount(p.getDepositAmount());
            dto.setClimateSurchargePercent(p.getClimateSurchargePercent());
        });

        return dto;
    }

    // --- Lấy danh sách bảng giá & mức cọc từ Database ---
    public List<PriceDto> getAllPrices() {
        List<UnitType> unitTypes = unitTypeRepository.findAll();
        List<Price> activePrices = priceRepository.findByStatus("ACTIVE");
        Map<Integer, Price> priceMap = activePrices.stream()
                .collect(Collectors.toMap(Price::getUnitTypeId, p -> p, (p1, p2) -> p1));

        return unitTypes.stream()
                .filter(ut -> "ACTIVE".equalsIgnoreCase(ut.getStatus()))
                .filter(ut -> !"CLIMATE_CONTROLLED".equalsIgnoreCase(ut.getStorageCondition())) // map 4 size chuẩn
                .map(ut -> {
                    PriceDto dto = new PriceDto();
                    dto.setUnitTypeId(ut.getUnitTypeId());
                    dto.setName(ut.getTypeName());
                    dto.setDimensions(ut.getSize());
                    dto.setStatus(ut.getStatus());

                    String lower = ut.getTypeName().toLowerCase();
                    if (lower.contains("size xxl") || lower.contains("xxl")) {
                        dto.setSize("XXL");
                        dto.setDescription("Kho diện tích lớn đặc biệt");
                        dto.setArea("15.0m²");
                        dto.setHeight("2.5m");
                    } else if (lower.contains("size xl") || lower.contains("kho doanh nghiệp") || lower.contains("xl")) {
                        dto.setSize("XL");
                        dto.setDescription("Kho doanh nghiệp lưu kho hàng hóa, máy móc, nguyên vật liệu");
                        dto.setArea("10.0m²");
                        dto.setHeight("2.0m");
                    } else if (lower.contains("size s") || lower.contains("tủ cá nhân")) {
                        dto.setSize("S");
                        dto.setDescription("Tủ cá nhân đồ đạc nhỏ, balo, vali, tài liệu cá nhân");
                        dto.setArea("1.0m²");
                        dto.setHeight("2.0m");
                    } else if (lower.contains("size l") || lower.contains("phòng lớn")) {
                        dto.setSize("L");
                        dto.setDescription("Phòng chứa lớn đồ gia đình 3-4 phòng, nội thất, pallet");
                        dto.setArea("6.0m²");
                        dto.setHeight("2.0m");
                    } else if (lower.contains("size m") || lower.contains("phòng vừa")) {
                        dto.setSize("M");
                        dto.setDescription("Phòng vừa đồ gia đình nhỏ, xe máy, 15-20 thùng carton");
                        dto.setArea("3.0m²");
                        dto.setHeight("2.0m");
                    } else {
                        dto.setSize(reqCustomSize(ut.getTypeName()));
                        dto.setDescription("Loại kho lưu trữ tiêu chuẩn");
                        dto.setArea("Tiêu chuẩn");
                        dto.setHeight("2.0m");
                    }

                    Price p = priceMap.get(ut.getUnitTypeId());
                    if (p != null) {
                        dto.setPriceId(p.getPriceId());
                        dto.setDailyPrice(p.getDailyPrice());
                        dto.setMonthlyPrice(p.getMonthlyPrice());
                        dto.setDepositAmount(p.getDepositAmount());
                        BigDecimal surchargePercent = (p.getClimateSurchargePercent() != null && p.getClimateSurchargePercent().compareTo(BigDecimal.ZERO) > 0)
                                ? p.getClimateSurchargePercent()
                                : BigDecimal.valueOf(20.00);
                        dto.setClimateSurchargePercent(surchargePercent);
                        BigDecimal surcharge = surchargePercent.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        dto.setAcPrice(p.getMonthlyPrice().multiply(BigDecimal.ONE.add(surcharge)).setScale(0, RoundingMode.HALF_UP));
                    } else {
                        dto.setDailyPrice(BigDecimal.valueOf(60000));
                        dto.setMonthlyPrice(BigDecimal.valueOf(1200000));
                        dto.setAcPrice(BigDecimal.valueOf(1440000));
                        dto.setDepositAmount(BigDecimal.valueOf(1000000));
                        dto.setClimateSurchargePercent(BigDecimal.valueOf(20.00));
                    }
                    return dto;
                })
                .sorted((a, b) -> {
                    List<String> order = List.of("S", "M", "L", "XL");
                    int idxA = order.indexOf(a.getSize());
                    int idxB = order.indexOf(b.getSize());
                    return Integer.compare(idxA != -1 ? idxA : 99, idxB != -1 ? idxB : 99);
                })
                .collect(Collectors.toList());
    }

    // --- Cập nhật Bảng giá và Mức cọc lưu vào Database ---
    @Transactional
    public PriceDto updatePrice(Integer unitTypeId, PriceDto req) {
        if (!unitTypeRepository.existsById(unitTypeId)) throw new RuntimeException("Không tìm thấy loại ô kho ID: " + unitTypeId);

        Optional<Price> existingPriceOpt = priceRepository.findByUnitTypeIdAndStatus(unitTypeId, "ACTIVE");
        Price price;
        if (existingPriceOpt.isPresent()) {
            price = existingPriceOpt.get();
        } else {
            price = new Price();
            price.setUnitTypeId(unitTypeId);
            price.setEffectiveFrom(java.time.LocalDate.now());
            price.setStatus("ACTIVE");
        }

        if (req.getDailyPrice() != null) price.setDailyPrice(req.getDailyPrice());
        if (req.getMonthlyPrice() != null) price.setMonthlyPrice(req.getMonthlyPrice());
        if (req.getDepositAmount() != null) price.setDepositAmount(req.getDepositAmount());
        if (req.getClimateSurchargePercent() != null) {
            price.setClimateSurchargePercent(req.getClimateSurchargePercent());
        } else {
            price.setClimateSurchargePercent(BigDecimal.valueOf(20.00));
        }

        Price saved = priceRepository.save(price);
        req.setPriceId(saved.getPriceId());
        req.setUnitTypeId(saved.getUnitTypeId());
        BigDecimal surcharge = saved.getClimateSurchargePercent().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        req.setAcPrice(saved.getMonthlyPrice().multiply(BigDecimal.ONE.add(surcharge)).setScale(0, RoundingMode.HALF_UP));
        return req;
    }

    private String reqCustomSize(String typeName) {
        if (typeName == null) return "CUSTOM";
        if (typeName.toUpperCase().startsWith("SIZE ")) {
            String[] parts = typeName.split(" ");
            if (parts.length > 1) return parts[1].replace("(", "").trim().toUpperCase();
        }
        return typeName.length() <= 6 ? typeName.toUpperCase() : "CUSTOM";
    }

    // --- BOM: Thêm loại ô kho mới kèm bảng giá & mức cọc vào Database ---
    @Transactional
    public PriceDto createPrice(PriceDto req) {
        UnitType ut = new UnitType();
        String sizeCode = (req.getSize() != null && !req.getSize().trim().isEmpty()) ? req.getSize().trim().toUpperCase() : "CUSTOM";
        String displayName = (req.getName() != null && !req.getName().trim().isEmpty()) ? req.getName().trim() : "Kho Mới";
        if (!displayName.toUpperCase().startsWith("SIZE ") && !displayName.toUpperCase().contains(sizeCode)) {
            ut.setTypeName(String.format("Size %s (%s)", sizeCode, displayName));
        } else {
            ut.setTypeName(displayName);
        }

        ut.setSize(req.getDimensions() != null && !req.getDimensions().trim().isEmpty() ? req.getDimensions().trim() : "2.0m x 2.0m x 2.0m");
        ut.setStorageCondition("NORMAL");
        ut.setStatus("ACTIVE");
        UnitType savedUt = unitTypeRepository.save(ut);

        Price price = new Price();
        price.setUnitTypeId(savedUt.getUnitTypeId());
        price.setDailyPrice(req.getDailyPrice() != null ? req.getDailyPrice() : BigDecimal.valueOf(50000));
        price.setMonthlyPrice(req.getMonthlyPrice() != null ? req.getMonthlyPrice() : BigDecimal.valueOf(1000000));
        price.setDepositAmount(req.getDepositAmount() != null ? req.getDepositAmount() : BigDecimal.valueOf(1000000));
        price.setClimateSurchargePercent(req.getClimateSurchargePercent() != null ? req.getClimateSurchargePercent() : BigDecimal.valueOf(20.00));
        price.setEffectiveFrom(java.time.LocalDate.now());
        price.setStatus("ACTIVE");
        Price savedPrice = priceRepository.save(price);

        req.setUnitTypeId(savedUt.getUnitTypeId());
        req.setPriceId(savedPrice.getPriceId());
        req.setName(savedUt.getTypeName());
        req.setSize(sizeCode);
        req.setDimensions(savedUt.getSize());
        req.setStatus("ACTIVE");
        BigDecimal surcharge = savedPrice.getClimateSurchargePercent().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        req.setAcPrice(savedPrice.getMonthlyPrice().multiply(BigDecimal.ONE.add(surcharge)).setScale(0, RoundingMode.HALF_UP));
        return req;
    }

    // --- BOM: Xóa mềm loại ô kho & bảng giá khỏi hệ thống ---
    @Transactional
    public void deletePrice(Integer unitTypeId) {
        UnitType ut = unitTypeRepository.findById(unitTypeId).orElse(null);
        if (ut != null) {
            ut.setStatus("INACTIVE");
            unitTypeRepository.save(ut);
        }

        Optional<Price> priceOpt = priceRepository.findByUnitTypeIdAndStatus(unitTypeId, "ACTIVE");
        if (priceOpt.isPresent()) {
            Price price = priceOpt.get();
            price.setStatus("INACTIVE");
            priceRepository.save(price);
        }
    }

    // --- Thêm cơ sở kho mới vào Database kèm Tự Động Sinh Tầng & Ô Kho theo Layout ---
    @Transactional
    public FacilityResponse createFacility(FacilityRequest req) {
        // 1. Tự động sinh mã cơ sở thông minh không trùng lặp nếu chưa có
        String code = req.getFacilityCode();
        if (code == null || code.trim().isEmpty()) {
            String addr = (req.getAddress() != null ? req.getAddress().toLowerCase() : "") + " " + (req.getFacilityName() != null ? req.getFacilityName().toLowerCase() : "");
            String cityPrefix = "HN";
            if (addr.contains("hồ chí minh") || addr.contains("ho chi minh") || addr.contains("hcm") || addr.contains("sài gòn") || addr.contains("sai gon") || addr.contains("tp.hcm")) {
                cityPrefix = "HCM";
            } else if (addr.contains("đà nẵng") || addr.contains("da nang") || addr.contains("dn")) {
                cityPrefix = "DN";
            } else if (addr.contains("cần thơ") || addr.contains("can tho") || addr.contains("ct")) {
                cityPrefix = "CT";
            } else if (addr.contains("hải phòng") || addr.contains("hai phong") || addr.contains("hp")) {
                cityPrefix = "HP";
            } else if (addr.contains("bình dương") || addr.contains("binh duong") || addr.contains("bd")) {
                cityPrefix = "BD";
            }

            final String finalPrefix = cityPrefix;
            List<Facility> allFacs = facilityRepository.findAll();
            int maxNum = 0;
            for (Facility fac : allFacs) {
                String c = fac.getFacilityCode();
                if (c == null) {
                    FacilityResponse fr = mapFacilityToResponse(fac);
                    c = fr.getFacilityCode();
                }
                if (c != null) {
                    String norm = c.replace("-", "").toUpperCase();
                    if (norm.startsWith(finalPrefix)) {
                        try {
                            String numPart = norm.substring(finalPrefix.length());
                            int num = Integer.parseInt(numPart);
                            if (num > maxNum) maxNum = num;
                        } catch (Exception ignored) {}
                    }
                }
            }
            code = String.format("%s%02d", cityPrefix, maxNum + 1);
        } else {
            code = code.trim().toUpperCase().replace("-", "");
        }

        // 2. TÊN CƠ SỞ HOÀN TOÀN THUẦN TÚY - KHÔNG GHÉP MÃ VÀO TÊN
        String rawName = req.getFacilityName() != null ? req.getFacilityName().trim() : "SmartStorage Cơ Sở Mới";
        if (rawName.contains("(") && rawName.contains(")")) {
            rawName = rawName.replaceAll("\\s*\\([^)]*\\)", "").trim();
        }

        String layout = (req.getLayoutType() != null && req.getLayoutType().equalsIgnoreCase("B")) ? "B" : "A";

        Facility f = new Facility();
        f.setFacilityName(rawName);
        f.setFacilityCode(code);
        f.setLayoutType(layout);
        f.setAddress(req.getAddress() != null ? req.getAddress().trim() : "Chưa cập nhật địa chỉ");
        f.setPhone(req.getPhone() != null && !req.getPhone().trim().isEmpty() ? req.getPhone() : "0900000000");
        f.setStatus(req.getStatus() != null && !req.getStatus().trim().isEmpty() ? req.getStatus().trim().toUpperCase() : "ACTIVE");
        Facility saved = facilityRepository.save(f);

        // 3. Tự động sinh danh sách Tầng (Floor) (chuẩn 3 tầng)
        int floors = (req.getFloorCount() != null && req.getFloorCount() >= 1) ? req.getFloorCount() : 3;
        List<Floor> createdFloors = new java.util.ArrayList<>();
        for (int fl = 1; fl <= floors; fl++) {
            Floor floor = new Floor();
            floor.setFacilityId(saved.getFacilityId());
            floor.setFloorName(fl == 1 ? "Tầng Trệt" : "Tầng " + (fl - 1));
            floor.setMaxLoadPerM2(fl == 1 ? BigDecimal.valueOf(1000) : BigDecimal.valueOf(500));
            floor.setStatus("ACTIVE");
            createdFloors.add(floorRepository.save(floor));
        }

        // 4. Tự động sinh danh sách Ô Kho (StorageUnit) theo Layout A hoặc B
        String cleanCode = code.replace("-", "");
        List<StorageUnit> newUnits = new java.util.ArrayList<>();

        // Floor 1 (Tầng Trệt):
        // Layout A: 10 ô XL
        // Layout B: 5 ô XL
        Floor floor1 = createdFloors.get(0);
        int xlCount = layout.equals("A") ? 10 : 5;
        for (int i = 1; i <= xlCount; i++) {
            String unitCode = String.format("%s-G-XL%02d", cleanCode, i);
            newUnits.add(new StorageUnit(unitCode, floor1.getFloorId(), 4, "AVAILABLE"));
        }

        // Floor 2 (Tầng 1):
        // Layout A: 8 ô S, 6 ô M, 4 ô L (18 ô)
        // Layout B: 3 ô M, 2 ô L (5 ô)
        if (createdFloors.size() >= 2) {
            Floor floor2 = createdFloors.get(1);
            if (layout.equals("A")) {
                for (int s = 1; s <= 8; s++) {
                    newUnits.add(new StorageUnit(String.format("%s-F1-S%02d", cleanCode, s), floor2.getFloorId(), 1, "AVAILABLE"));
                }
                for (int m = 1; m <= 6; m++) {
                    newUnits.add(new StorageUnit(String.format("%s-F1-M%02d", cleanCode, m), floor2.getFloorId(), 2, "AVAILABLE"));
                }
                for (int l = 1; l <= 4; l++) {
                    newUnits.add(new StorageUnit(String.format("%s-F1-L%02d", cleanCode, l), floor2.getFloorId(), 3, "AVAILABLE"));
                }
            } else {
                for (int s = 1; s <= 2; s++) {
                    newUnits.add(new StorageUnit(String.format("%s-F1-S%02d", cleanCode, s), floor2.getFloorId(), 1, "AVAILABLE"));
                }
                for (int m = 1; m <= 2; m++) {
                    newUnits.add(new StorageUnit(String.format("%s-F1-M%02d", cleanCode, m), floor2.getFloorId(), 2, "AVAILABLE"));
                }
                for (int l = 1; l <= 1; l++) {
                    newUnits.add(new StorageUnit(String.format("%s-F1-L%02d", cleanCode, l), floor2.getFloorId(), 3, "AVAILABLE"));
                }
            }
        }

        // Floor 3 (Tầng 2):
        // Layout A: 6 ô S, 8 ô M, 4 ô L (18 ô)
        // Layout B: 2 ô S, 2 ô M, 1 ô L (5 ô)
        if (createdFloors.size() >= 3) {
            Floor floor3 = createdFloors.get(2);
            if (layout.equals("A")) {
                for (int s = 1; s <= 6; s++) {
                    newUnits.add(new StorageUnit(String.format("%s-F2-S%02d", cleanCode, s), floor3.getFloorId(), 1, "AVAILABLE"));
                }
                for (int m = 1; m <= 8; m++) {
                    newUnits.add(new StorageUnit(String.format("%s-F2-M%02d", cleanCode, m), floor3.getFloorId(), 2, "AVAILABLE"));
                }
                for (int l = 1; l <= 4; l++) {
                    newUnits.add(new StorageUnit(String.format("%s-F2-L%02d", cleanCode, l), floor3.getFloorId(), 3, "AVAILABLE"));
                }
            } else {
                for (int s = 1; s <= 2; s++) {
                    newUnits.add(new StorageUnit(String.format("%s-F2-S%02d", cleanCode, s), floor3.getFloorId(), 1, "AVAILABLE"));
                }
                for (int m = 1; m <= 2; m++) {
                    newUnits.add(new StorageUnit(String.format("%s-F2-M%02d", cleanCode, m), floor3.getFloorId(), 2, "AVAILABLE"));
                }
                for (int l = 1; l <= 1; l++) {
                    newUnits.add(new StorageUnit(String.format("%s-F2-L%02d", cleanCode, l), floor3.getFloorId(), 3, "AVAILABLE"));
                }
            }
        }

        storageUnitRepository.saveAll(newUnits);

        if (req.getManagerName() != null && !req.getManagerName().trim().isEmpty() && !req.getManagerName().equalsIgnoreCase("Chưa phân công") && employeeProfileRepository != null && accountRepository != null) {
            String targetName = req.getManagerName().trim();
            List<com.swp391.backend.entity.Account> allAccs = accountRepository.findAll();
            Optional<com.swp391.backend.entity.Account> matchedMgr = allAccs.stream()
                    .filter(a -> Long.valueOf(3L).equals(a.getRoleId()))
                    .filter(a -> a.getFullName() != null && a.getFullName().toLowerCase().contains(targetName.toLowerCase()))
                    .findFirst();
            if (matchedMgr.isPresent()) {
                employeeProfileRepository.save(new com.swp391.backend.entity.EmployeeProfile(matchedMgr.get().getAccountId().intValue(), saved.getFacilityId()));
            }
        }

        FacilityResponse res = mapFacilityToResponse(saved);
        res.setFacilityCode(code);
        res.setLayoutType(layout);
        res.setFloorCount(floors);
        return res;
    }

    // --- Cập nhật cơ sở kho vào Database ---
    @Transactional
    public FacilityResponse updateFacility(Integer facilityId, FacilityRequest req) {
        Facility f = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở ID: " + facilityId));
        if (req.getFacilityName() != null) {
            String name = req.getFacilityName().trim();
            if (name.contains("(") && name.contains(")")) {
                name = name.replaceAll("\\s*\\([^)]*\\)", "").trim();
            }
            f.setFacilityName(name);
        }
        if (req.getFacilityCode() != null) f.setFacilityCode(req.getFacilityCode().trim().toUpperCase().replace("-", ""));
        if (req.getLayoutType() != null) f.setLayoutType(req.getLayoutType().trim().toUpperCase());
        if (req.getAddress() != null) f.setAddress(req.getAddress().trim());
        if (req.getPhone() != null) f.setPhone(req.getPhone().trim());
        if (req.getStatus() != null) f.setStatus(req.getStatus().trim());
        Facility saved = facilityRepository.save(f);

        if (req.getManagerName() != null && employeeProfileRepository != null && accountRepository != null) {
            String targetName = req.getManagerName().trim();
            List<com.swp391.backend.entity.EmployeeProfile> existingEmps = employeeProfileRepository.findByFacilityId(facilityId);
            for (com.swp391.backend.entity.EmployeeProfile ep : existingEmps) {
                Optional<com.swp391.backend.entity.Account> acc = accountRepository.findAccountByAccountId(ep.getAccountId());
                if (acc.isPresent() && Long.valueOf(3L).equals(acc.get().getRoleId())) {
                    employeeProfileRepository.delete(ep);
                }
            }
            if (!targetName.isEmpty() && !targetName.equalsIgnoreCase("Chưa phân công")) {
                List<com.swp391.backend.entity.Account> allAccs = accountRepository.findAll();
                Optional<com.swp391.backend.entity.Account> matchedMgr = allAccs.stream()
                        .filter(a -> Long.valueOf(3L).equals(a.getRoleId()))
                        .filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus()))
                        .filter(a -> a.getFullName() != null && (a.getFullName().equalsIgnoreCase(targetName) || a.getFullName().toLowerCase().contains(targetName.toLowerCase())))
                        .findFirst();
                if (matchedMgr.isPresent()) {
                    Account mgrAcc = matchedMgr.get();
                    Optional<com.swp391.backend.entity.EmployeeProfile> otherFacEmp = employeeProfileRepository.findByAccountId(mgrAcc.getAccountId().intValue());
                    if (otherFacEmp.isPresent()) {
                        com.swp391.backend.entity.EmployeeProfile ep = otherFacEmp.get();
                        if (ep.getFacilityId() != null && !ep.getFacilityId().equals(facilityId)) {
                            throw new IllegalArgumentException("Quản lý [" + mgrAcc.getFullName() + "] đã phụ trách cơ sở khác (#" + ep.getFacilityId() + ")! Mỗi cơ sở chỉ được có 1 Quản lý và 1 Quản lý chỉ quản lý 1 cơ sở.");
                        }
                        ep.setFacilityId(facilityId);
                        employeeProfileRepository.save(ep);
                    } else {
                        employeeProfileRepository.save(new com.swp391.backend.entity.EmployeeProfile(mgrAcc.getAccountId().intValue(), facilityId));
                    }
                }
            }
        }

        return mapFacilityToResponse(saved);
    }

    // --- Xóa mềm cơ sở kho vào Database (status = 'INACTIVE') ---
    @Transactional
    public void deleteFacility(Integer facilityId) {
        Facility f = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở ID: " + facilityId));
        f.setStatus("INACTIVE");
        facilityRepository.save(f);
    }

}
