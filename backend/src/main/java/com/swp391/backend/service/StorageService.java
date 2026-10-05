package com.swp391.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.FacilityResponse;
import com.swp391.backend.dto.UnitDetailResponse;
import com.swp391.backend.entity.ActivityLog;
import com.swp391.backend.entity.Facility;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Price;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.entity.UnitType;
import com.swp391.backend.repository.ActivityLogRepository;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.PriceRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import com.swp391.backend.repository.UnitTypeRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StorageService {

    private final FacilityRepository facilityRepository;
    private final FloorRepository floorRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final PriceRepository priceRepository;
    private final ActivityLogRepository activityLogRepository;

    public StorageService(FacilityRepository facilityRepository,
            FloorRepository floorRepository,
            UnitTypeRepository unitTypeRepository,
            StorageUnitRepository storageUnitRepository,
            PriceRepository priceRepository,
            ActivityLogRepository activityLogRepository) {
        this.facilityRepository = facilityRepository;
        this.floorRepository = floorRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.priceRepository = priceRepository;
        this.activityLogRepository = activityLogRepository;
    }

    //Lấy danh sách Cơ sở kèm mã code, shortCode và layout
    public List<FacilityResponse> getAllActiveFacilities() {
        return facilityRepository.findByStatus("ACTIVE").stream()
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

            // Chiết khấu gói tháng theo BR-13
            if (duration >= 12) {
                discountPercent = BigDecimal.valueOf(15); // Giảm 15%
            } else if (duration >= 6) {
                discountPercent = BigDecimal.valueOf(10); // Giảm 10%
            } else if (duration >= 3) {
                discountPercent = BigDecimal.valueOf(5);  // Giảm 5%
            }
        }

        BigDecimal discountAmount = baseTotal.multiply(discountPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // Phụ phí kho mát (Climate Controlled +20% theo BR-08) nếu có
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
        response.setTotalInitialPayment(depositAmount); // Đặt cọc 100% online theo BR-16

        return response;
    }

    public FacilityResponse mapFacilityToResponse(Facility f) {
        FacilityResponse res = new FacilityResponse();
        res.setFacilityId(f.getFacilityId());
        res.setFacilityName(f.getFacilityName());
        res.setAddress(f.getAddress());
        res.setPhone(f.getPhone());
        res.setStatus(f.getStatus());

        // Gán metadata chuẩn theo Take note.txt
        switch (f.getFacilityId()) {
            case 1:
                res.setFacilityCode("HN-01");
                res.setShortCode("CG");
                res.setFloorCount(3);
                res.setLayoutType("A");
                res.setIsAllClimate(false);
                break;
            case 2:
                res.setFacilityCode("HN-02");
                res.setShortCode("TX");
                res.setFloorCount(3);
                res.setLayoutType("B");
                res.setIsAllClimate(false);
                break;
            case 3:
                res.setFacilityCode("HCM-01");
                res.setShortCode("Q1");
                res.setFloorCount(3);
                res.setLayoutType("A");
                res.setIsAllClimate(true); // 100% kho mát
                break;
            case 4:
                res.setFacilityCode("HCM-02");
                res.setShortCode("Q7");
                res.setFloorCount(2);
                res.setLayoutType("B");
                res.setIsAllClimate(false);
                break;
            case 5:
                res.setFacilityCode("HCM-03");
                res.setShortCode("TD");
                res.setFloorCount(3);
                res.setLayoutType("B");
                res.setIsAllClimate(false);
                break;
            case 6:
                res.setFacilityCode("DN-01");
                res.setShortCode("HC");
                res.setFloorCount(2);
                res.setLayoutType("A");
                res.setIsAllClimate(false);
                break;
            case 7:
                res.setFacilityCode("CT-01");
                res.setShortCode("NK");
                res.setFloorCount(2);
                res.setLayoutType("B");
                res.setIsAllClimate(false);
                break;
            default:
                res.setFacilityCode("FAC-0" + f.getFacilityId());
                res.setShortCode("FC");
                res.setFloorCount(2);
                res.setLayoutType("A");
                res.setIsAllClimate(false);
                break;
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
        StorageUnit unit = storageUnitRepository.findById(unitCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ô kho: " + unitCode));

        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new RuntimeException("Lỗi dữ liệu tầng!"));

        if (managerFacilityId != null && !floor.getFacilityId().equals(managerFacilityId)) {
            throw new AccessDeniedException("Bạn không có quyền quản lý ô kho thuộc cơ sở này!");
        }

        if ("OCCUPIED".equalsIgnoreCase(unit.getStatus()) || "RESERVED".equalsIgnoreCase(unit.getStatus()) || "HOLD".equalsIgnoreCase(unit.getStatus())) {
            throw new RuntimeException("Không thể đưa vào bảo trì khi ô kho đang có khách đặt hoặc đang thuê! Trạng thái: " + unit.getStatus());
        }

        unit.setStatus("UNDER_MAINTENANCE");
        StorageUnit saved = storageUnitRepository.save(unit);

        if (activityLogRepository != null && accountId != null) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(accountId);
            log.setAction("PUT_MAINTENANCE");
            log.setDescription("Đưa ô kho " + unitCode + " vào trạng thái bảo trì UNDER_MAINTENANCE");
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

        if (!"UNDER_MAINTENANCE".equalsIgnoreCase(unit.getStatus()) && !"MAINTENANCE".equalsIgnoreCase(unit.getStatus())) {
            throw new RuntimeException("Chỉ có thể nghiệm thu ô kho đang ở trạng thái bảo trì (UNDER_MAINTENANCE)! Trạng thái hiện tại: " + unit.getStatus());
        }

        unit.setStatus("AVAILABLE");
        StorageUnit saved = storageUnitRepository.save(unit);

        if (activityLogRepository != null && accountId != null) {
            ActivityLog log = new ActivityLog();
            log.setAccountId(accountId);
            log.setAction("COMPLETE_MAINTENANCE");
            log.setDescription("Nghiệm thu hoàn tất bảo trì, mở lại ô kho " + unitCode + " thành AVAILABLE");
            log.setCreatedAt(java.time.LocalDateTime.now());
            activityLogRepository.save(log);
        }

        return saved;
    }

    // --- US-14: Lấy danh sách ô kho đang bảo trì của cơ sở ---
    public List<UnitDetailResponse> getMaintenanceUnits(Integer facilityId) {
        return filterUnits(facilityId, null, null, null, "UNDER_MAINTENANCE");
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
        String floorPrefix = "G";
        String facCode = "HN01";
        Optional<Floor> floorOpt = floorRepository.findById(u.getFloorId());
        if (floorOpt.isPresent()) {
            Floor fl = floorOpt.get();
            dto.setFloorName(fl.getFloorName());
            dto.setMaxLoadKgM2(fl.getMaxLoadPerM2() != null ? fl.getMaxLoadPerM2() : BigDecimal.valueOf(500));

            // Xác định tiền tố tầng cho unitCode (G = Trệt, 1 = Tầng 1, 2 = Tầng 2)
            if (fl.getFloorName().toLowerCase().contains("trệt")) {
                floorPrefix = "G";
            } else if (fl.getFloorName().contains("1")) {
                floorPrefix = "1";
            } else if (fl.getFloorName().contains("2")) {
                floorPrefix = "2";
            }

            Optional<Facility> facOpt = facilityRepository.findById(fl.getFacilityId());
            if (facOpt.isPresent()) {
                FacilityResponse fr = mapFacilityToResponse(facOpt.get());
                facCode = fr.getFacilityCode().replace("-", "");
            }
        }

        // Lấy thông tin Loại kho và Kích thước chuẩn
        String sizeCode = "M";
        Optional<UnitType> unitTypeOpt = unitTypeRepository.findById(u.getUnitTypeId());
        if (unitTypeOpt.isPresent()) {
            UnitType ut = unitTypeOpt.get();
            dto.setTypeName(ut.getTypeName());
            dto.setSize(ut.getSize());
            dto.setStorageCondition(ut.getStorageCondition());
            dto.setIsClimate("CLIMATE_CONTROLLED".equalsIgnoreCase(ut.getStorageCondition()));

            // Gán kích thước chuẩn Dài x Rộng x Cao (BR-08)
            String lowerType = ut.getTypeName().toLowerCase();
            if (lowerType.contains("xl")) {
                sizeCode = "XL";
                dto.setLengthM(4.0);
                dto.setWidthM(2.5);
                dto.setHeightM(2.0);
                dto.setAreaM2(10.0);
            } else if (lowerType.contains("size s") || lowerType.startsWith("s ") || lowerType.equals("s")) {
                sizeCode = "S";
                dto.setLengthM(1.0);
                dto.setWidthM(1.0);
                dto.setHeightM(2.0);
                dto.setAreaM2(1.0);
            } else if (lowerType.contains("size l") || lowerType.startsWith("l ") || lowerType.equals("l")) {
                sizeCode = "L";
                dto.setLengthM(3.0);
                dto.setWidthM(2.0);
                dto.setHeightM(2.0);
                dto.setAreaM2(6.0);
            } else {
                sizeCode = "M";
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

}
