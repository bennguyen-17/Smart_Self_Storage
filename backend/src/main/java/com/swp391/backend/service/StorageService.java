package com.swp391.backend.service;

import com.swp391.backend.dto.CalculatePriceRequest;
import com.swp391.backend.dto.CalculatePriceResponse;
import com.swp391.backend.dto.UnitDetailResponse;
import com.swp391.backend.entity.*;
import com.swp391.backend.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StorageService {

    private final FacilityRepository facilityRepository;
    private final FloorRepository floorRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final PriceRepository priceRepository;

    public StorageService(FacilityRepository facilityRepository,
                          FloorRepository floorRepository,
                          UnitTypeRepository unitTypeRepository,
                          StorageUnitRepository storageUnitRepository,
                          PriceRepository priceRepository) {
        this.facilityRepository = facilityRepository;
        this.floorRepository = floorRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.priceRepository = priceRepository;
    }

    // --- 1. Lấy danh sách Cơ sở ---
    public List<Facility> getAllActiveFacilities() {
        return facilityRepository.findByStatus("ACTIVE");
    }

    public Optional<Facility> getFacilityById(Integer facilityId) {
        return facilityRepository.findById(facilityId);
    }

    // --- 2. Lấy danh sách Tầng theo Cơ sở ---
    public List<Floor> getFloorsByFacilityId(Integer facilityId) {
        return floorRepository.findByFacilityIdAndStatus(facilityId, "ACTIVE");
    }

    // --- 3. Lấy danh sách Ô kho theo Tầng (kèm giá & loại kho) ---
    public List<UnitDetailResponse> getUnitsByFloorId(Integer floorId) {
        List<StorageUnit> units = storageUnitRepository.findByFloorId(floorId);
        return mapToUnitDetailResponses(units);
    }

    // --- 4. Bộ lọc Ô kho linh hoạt ---
    public List<UnitDetailResponse> filterUnits(Integer facilityId, Integer floorId, Integer unitTypeId, String storageCondition, String status) {
        List<StorageUnit> allUnits;

        if (floorId != null) {
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
                    if (storageCondition == null || storageCondition.trim().isEmpty()) return true;
                    UnitType ut = unitTypeMap.get(u.getUnitTypeId());
                    return ut != null && ut.getStorageCondition().equalsIgnoreCase(storageCondition);
                })
                .map(this::mapSingleUnit)
                .collect(Collectors.toList());
    }

    // --- 5. Tính giá thuê và tiền cọc tự động (BR-08 & BR-13) ---
    public CalculatePriceResponse calculateRentalPrice(CalculatePriceRequest request) {
        if (request.getUnitTypeId() == null) {
            return CalculatePriceResponse.error("Vui lòng chọn loại kho (unitTypeId)!");
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
                return CalculatePriceResponse.error("Thời hạn thuê theo ngày tối thiểu là 7 ngày (theo BR-13)!");
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

    // --- Helper Mappers ---
    private List<UnitDetailResponse> mapToUnitDetailResponses(List<StorageUnit> units) {
        return units.stream().map(this::mapSingleUnit).collect(Collectors.toList());
    }

    private UnitDetailResponse mapSingleUnit(StorageUnit u) {
        UnitDetailResponse dto = new UnitDetailResponse();
        dto.setUnitId(u.getUnitId());
        dto.setFloorId(u.getFloorId());
        dto.setUnitTypeId(u.getUnitTypeId());
        dto.setStatus(u.getStatus());

        unitTypeRepository.findById(u.getUnitTypeId()).ifPresent(ut -> {
            dto.setTypeName(ut.getTypeName());
            dto.setSize(ut.getSize());
            dto.setStorageCondition(ut.getStorageCondition());
        });

        priceRepository.findByUnitTypeIdAndStatus(u.getUnitTypeId(), "ACTIVE").ifPresent(p -> {
            dto.setDailyPrice(p.getDailyPrice());
            dto.setMonthlyPrice(p.getMonthlyPrice());
            dto.setDepositAmount(p.getDepositAmount());
            dto.setClimateSurchargePercent(p.getClimateSurchargePercent());
        });

        return dto;
    }
}
