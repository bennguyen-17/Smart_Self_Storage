package com.swp391.backend.service;

import com.swp391.backend.dto.StoredImageResponse;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Payment;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.entity.StoredImage;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.AccountRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.FloorRepository;
import com.swp391.backend.repository.PaymentRepository;
import com.swp391.backend.repository.ReservationRepository;
import com.swp391.backend.repository.StorageUnitRepository;
import com.swp391.backend.repository.StoredImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final int MAX_IMAGES_PER_ACTION = 5;
    private static final Set<String> FACILITY_CATEGORIES = Set.of(
            "FACILITY_COVER", "UNITS_ALL", "UNIT_STANDARD", "UNIT_CLIMATE");
    private static final Set<String> BUSINESS_CATEGORIES = Set.of(
            "CHECKOUT_INSPECTION", "REFUND_RECEIPT", "FORFEIT_EVIDENCE");
    private static final Map<String, String> FACILITY_KEYS = Map.of(
            "cover", "FACILITY_COVER",
            "allUnits", "UNITS_ALL",
            "standard", "UNIT_STANDARD",
            "climate", "UNIT_CLIMATE");

    private final StoredImageRepository imageRepository;
    private final FacilityRepository facilityRepository;
    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final PaymentRepository paymentRepository;
    private final AccountRepository accountRepository;
    private final Path uploadRoot;
    private final Path facilityImageDirectory;
    private final Path evidenceDirectory;

    public ImageStorageService(
            StoredImageRepository imageRepository,
            FacilityRepository facilityRepository,
            ContractRepository contractRepository,
            ReservationRepository reservationRepository,
            StorageUnitRepository storageUnitRepository,
            FloorRepository floorRepository,
            EmployeeProfileRepository employeeProfileRepository,
            PaymentRepository paymentRepository,
            AccountRepository accountRepository,
            @Value("${app.upload.root-dir:uploads}") String uploadRoot,
            @Value("${app.upload.facility-image-dir:${app.upload.root-dir:uploads}/facilities}") String facilityImageDirectory,
            @Value("${app.upload.evidence-dir:${app.upload.root-dir:uploads}/evidence}") String evidenceDirectory) {
        this.imageRepository = imageRepository;
        this.facilityRepository = facilityRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.paymentRepository = paymentRepository;
        this.accountRepository = accountRepository;
        this.uploadRoot = Path.of(uploadRoot).toAbsolutePath().normalize();
        this.facilityImageDirectory = resolveConfiguredDirectory(facilityImageDirectory);
        this.evidenceDirectory = resolveConfiguredDirectory(evidenceDirectory);
    }

    @Transactional
    public StoredImageResponse uploadImage(
            MultipartFile file, String category, Integer uploaderAccountId, Collection<String> authorities) {
        String normalizedCategory = category == null ? "" : category.trim().toUpperCase(Locale.ROOT);
        Integer typeCode = typeCodeFor(normalizedCategory);
        if (typeCode == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại ảnh không hợp lệ.");
        }
        if (uploaderAccountId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if (!canUploadCategory(normalizedCategory, authorities)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền tải loại ảnh này lên.");
        }

        ValidatedImage validated = validateImage(file);
        Path destination = writeImage(normalizedCategory, validated);
        StoredImage image = new StoredImage();
        image.setTypeCode(typeCode);
        image.setCategory(normalizedCategory);
        image.setStoragePath(toStoragePath(destination));
        image.setOriginalFileName(validated.originalFileName());
        image.setContentType(contentTypeFor(validated.extension()));
        image.setFileSize((long) validated.content().length);
        image.setUploadedBy(uploaderAccountId);
        image.setUploadedAt(LocalDateTime.now());
        image.setImageStatus("PENDING");
        try {
            return toResponse(imageRepository.saveAndFlush(image));
        } catch (RuntimeException ex) {
            deleteFile(destination);
            throw ex;
        }
    }

    @Transactional
    public void attachFacilityImages(Integer facilityId, Map<String, Integer> imageIds, Integer uploaderAccountId) {
        if (!facilityRepository.existsById(facilityId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cơ sở.");
        }
        if (imageIds == null || imageIds.isEmpty()) {
            return;
        }

        for (Map.Entry<String, Integer> entry : imageIds.entrySet()) {
            if (entry.getValue() == null) continue;
            String category = FACILITY_KEYS.get(entry.getKey());
            if (category == null && FACILITY_CATEGORIES.contains(entry.getKey())) {
                category = entry.getKey();
            }
            if (category == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slot ảnh cơ sở không hợp lệ: " + entry.getKey());
            }

            StoredImage pendingImage = requirePendingImage(entry.getValue(), category, uploaderAccountId);
            StoredImage previousImage = imageRepository
                    .findByFacilityIdAndCategoryAndImageStatus(facilityId, category, "LINKED")
                    .orElse(null);
            String previousPath = previousImage != null ? previousImage.getStoragePath() : null;
            if (previousImage != null) {
                imageRepository.delete(previousImage);
                imageRepository.flush();
            }

            pendingImage.setFacilityId(facilityId);
            pendingImage.setImageStatus("LINKED");
            imageRepository.saveAndFlush(pendingImage);
            if (previousPath != null) deleteStoredFile(previousPath);
        }
    }

    @Transactional
    public List<StoredImage> attachCheckoutImages(Integer contractId, List<Integer> imageIds, Integer uploaderAccountId) {
        if (imageIds == null || imageIds.isEmpty() || imageIds.size() > MAX_IMAGES_PER_ACTION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chốt trả kho cần từ 1 đến 5 ảnh nghiệm thu.");
        }
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
        requireStaffAtContractFacility(contract, uploaderAccountId);
        return attachContractImages(contract, imageIds, uploaderAccountId, "CHECKOUT_INSPECTION");
    }

    @Transactional
    public void attachRefundReceipt(Integer paymentId, Integer imageId, Integer uploaderAccountId) {
        if (imageId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã ảnh biên lai hoàn tiền.");
        }
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiếu hoàn tiền."));
        Contract contract = contractRepository.findById(payment.getContractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
        requireStaffAtContractFacility(contract, uploaderAccountId);
        StoredImage image = requirePendingImage(imageId, "REFUND_RECEIPT", uploaderAccountId);
        image.setPaymentId(paymentId);
        image.setImageStatus("LINKED");
        imageRepository.save(image);
    }

    @Transactional
    public List<StoredImage> attachForfeitEvidence(Integer contractId, List<Integer> imageIds, Integer uploaderAccountId) {
        if (imageIds == null || imageIds.isEmpty() || imageIds.size() > MAX_IMAGES_PER_ACTION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần ít nhất một ảnh minh chứng thanh lý.");
        }
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
        requireStaffAtContractFacility(contract, uploaderAccountId);
        return attachContractImages(contract, imageIds, uploaderAccountId, "FORFEIT_EVIDENCE");
    }

    public Map<String, String> getFacilityImageUrls(Integer facilityId) {
        Map<String, String> images = new LinkedHashMap<>();
        imageRepository.findByFacilityIdAndImageStatusOrderByCategoryAsc(facilityId, "LINKED")
                .forEach(image -> images.put(facilityKeyFor(image.getCategory()), imageUrl(image)));
        return images;
    }

    public List<StoredImageResponse> getCheckoutImageResponses(Integer contractId) {
        return imageRepository.findByContractIdAndCategoryOrderByUploadedAtAscImageIdAsc(
                        contractId, "CHECKOUT_INSPECTION").stream()
                .map(this::toResponse)
                .toList();
    }

    public List<StoredImageResponse> getForfeitEvidenceResponses(Integer contractId) {
        return imageRepository.findByContractIdAndCategoryOrderByUploadedAtAscImageIdAsc(
                        contractId, "FORFEIT_EVIDENCE").stream()
                .map(this::toResponse)
                .toList();
    }

    public String getRefundReceiptUrl(Integer paymentId) {
        return imageRepository.findByPaymentIdAndCategoryOrderByUploadedAtAscImageIdAsc(
                        paymentId, "REFUND_RECEIPT").stream()
                .findFirst().map(this::imageUrl).orElse(null);
    }

    public String getImageUrl(Integer imageId) {
        return imageRepository.findById(imageId)
                .map(this::imageUrl)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh."));
    }

    public List<StoredImageResponse> toResponses(List<StoredImage> images) {
        return images.stream().map(this::toResponse).toList();
    }

    
    public ImageFile loadReceiptImageFile(String receiptUrl) {
        if (receiptUrl == null || receiptUrl.isBlank()) return null;
        Integer imageId = null;
        if (receiptUrl.contains("/api/images/")) {
            try {
                String idStr = receiptUrl.substring(receiptUrl.lastIndexOf('/') + 1).trim();
                imageId = Integer.parseInt(idStr);
            } catch (Exception ignored) {}
        }
        if (imageId != null) {
            StoredImage img = imageRepository.findById(imageId).orElse(null);
            if (img != null) {
                Path file = fileForStoragePath(img.getStoragePath());
                if (file != null && Files.isRegularFile(file)) {
                    try {
                        return new ImageFile(Files.readAllBytes(file), img.getContentType());
                    } catch (Exception ignored) {}
                }
            }
        }
        return null;
    }
    public ImageFile loadImage(Integer imageId, Integer accountId, Collection<String> authorities) {
        StoredImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh."));
        if (!canViewImage(image, accountId, authorities)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem ảnh này.");
        }
        Path file = fileForStoragePath(image.getStoragePath());
        if (file == null || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy file ảnh.");
        }
        try {
            return new ImageFile(Files.readAllBytes(file), image.getContentType());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể đọc file ảnh.", ex);
        }
    }

    private List<StoredImage> attachContractImages(
            Contract contract, List<Integer> imageIds, Integer uploaderAccountId, String category) {
        if (imageIds.stream().distinct().count() != imageIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã ảnh bị trùng lặp.");
        }
        List<StoredImage> attached = new ArrayList<>();
        for (Integer imageId : imageIds) {
            StoredImage image = requirePendingImage(imageId, category, uploaderAccountId);
            image.setContractId(contract.getContractId());
            image.setImageStatus("LINKED");
            attached.add(imageRepository.save(image));
        }
        return attached;
    }

    private StoredImage requirePendingImage(Integer imageId, String category, Integer uploaderAccountId) {
        StoredImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy ảnh ID " + imageId));
        if (!category.equals(image.getCategory()) || !"PENDING".equals(image.getImageStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh không đúng loại hoặc đã được liên kết.");
        }
        if (image.getUploadedBy() == null || !image.getUploadedBy().equals(uploaderAccountId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không sở hữu ảnh upload này.");
        }
        return image;
    }

    private void requireStaffAtContractFacility(Contract contract, Integer accountId) {
        EmployeeProfile employee = employeeProfileRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Không tìm thấy hồ sơ nhân viên."));
        if (!employee.getFacilityId().equals(findContractFacilityId(contract))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hợp đồng không thuộc cơ sở của bạn.");
        }
    }

    private Integer findContractFacilityId(Contract contract) {
        Reservation reservation = reservationRepository.findById(contract.getReservationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đặt chỗ của hợp đồng."));
        StorageUnit unit = storageUnitRepository.findById(reservation.getUnitCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho."));
        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tầng kho."));
        return floor.getFacilityId();
    }

    private boolean canViewImage(StoredImage image, Integer accountId, Collection<String> authorities) {
        boolean admin = authorities != null && authorities.contains("ROLE_ADMIN");
        if (admin) return true;
        if ("PENDING".equals(image.getImageStatus())) {
            return accountId != null && accountId.equals(image.getUploadedBy());
        }
        if (image.getTypeCode() == StoredImage.TYPE_SYSTEM) return true;
        if ("REFUND_RECEIPT".equals(image.getCategory())) return true;
        if ("FORFEIT_EVIDENCE".equals(image.getCategory())
                && (authorities == null || (!authorities.contains("ROLE_ADMIN") && !authorities.contains("ROLE_MANAGER")))) {
            return false;
        }
        if (accountId == null) return false;

        Contract contract = image.getContractId() != null
                ? contractRepository.findById(image.getContractId()).orElse(null)
                : paymentRepository.findById(image.getPaymentId())
                        .map(Payment::getContractId).flatMap(contractRepository::findById).orElse(null);
        if (contract == null) return false;
        Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
        if (reservation == null) return false;
        if (accountId.equals(reservation.getAccountId())) return true;

        boolean employeeRole = authorities != null && (authorities.contains("ROLE_STAFF")
                || authorities.contains("ROLE_MANAGER"));
        if (!employeeRole) return false;
        EmployeeProfile employee = employeeProfileRepository.findByAccountId(accountId).orElse(null);
        return employee != null && employee.getFacilityId().equals(findContractFacilityId(contract));
    }

    private boolean canUploadCategory(String category, Collection<String> authorities) {
        if (authorities == null) return false;
        if (FACILITY_CATEGORIES.contains(category)) {
            return authorities.contains("ROLE_BOM") || authorities.contains("ROLE_ADMIN");
        }
        if ("CHECKOUT_INSPECTION".equals(category)) {
            return authorities.contains("ROLE_STAFF") || authorities.contains("ROLE_MANAGER")
                    || authorities.contains("ROLE_ADMIN");
        }
        return "REFUND_RECEIPT".equals(category) || "FORFEIT_EVIDENCE".equals(category)
                ? authorities.contains("ROLE_MANAGER") || authorities.contains("ROLE_ADMIN")
                : false;
    }

    private Integer typeCodeFor(String category) {
        if (FACILITY_CATEGORIES.contains(category)) return StoredImage.TYPE_SYSTEM;
        if (BUSINESS_CATEGORIES.contains(category)) return StoredImage.TYPE_BUSINESS;
        return null;
    }

    private String facilityKeyFor(String category) {
        return FACILITY_KEYS.entrySet().stream()
                .filter(entry -> entry.getValue().equals(category))
                .map(Map.Entry::getKey)
                .findFirst().orElse(category);
    }

    private StoredImageResponse toResponse(StoredImage image) {
        String uploadedBy = image.getUploadedBy() == null ? null
                : accountRepository.findAccountByAccountId(image.getUploadedBy())
                        .map(account -> account.getFullName()).orElse(null);
        return new StoredImageResponse(image, uploadedBy);
    }

    private ValidatedImage validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh tải lên không được để trống.");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mỗi ảnh không được vượt quá 5 MB.");
        }
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không thể đọc file ảnh.", ex);
        }
        String extension = detectImageExtension(content);
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.");
        }
        return new ValidatedImage(content, extension, safeOriginalFileName(file.getOriginalFilename()));
    }

    private Path writeImage(String category, ValidatedImage image) {
        Path baseDirectory = FACILITY_CATEGORIES.contains(category) ? facilityImageDirectory : evidenceDirectory;
        Path directory = baseDirectory.resolve(category);
        Path destination = directory.resolve(UUID.randomUUID() + "." + image.extension()).normalize();
        if (!directory.toAbsolutePath().normalize().startsWith(uploadRoot)
                || !destination.startsWith(directory.toAbsolutePath().normalize())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đường dẫn lưu ảnh không hợp lệ.");
        }
        try {
            Files.createDirectories(directory);
            Files.write(destination, image.content());
            return destination;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu file ảnh.", ex);
        }
    }

    private Path resolveConfiguredDirectory(String directory) {
        Path path = Path.of(directory).toAbsolutePath().normalize();
        if (!path.startsWith(uploadRoot)) {
            throw new IllegalArgumentException("Upload directory must be inside app.upload.root-dir");
        }
        return path;
    }

    private String toStoragePath(Path file) {
        return uploadRoot.relativize(file.toAbsolutePath().normalize())
                .toString().replace('\\', '/');
    }

    private String imageUrl(StoredImage image) {
        return "/api/images/" + image.getImageId();
    }

    private String detectImageExtension(byte[] content) {
        if (content.length >= 3 && (content[0] & 0xFF) == 0xFF && (content[1] & 0xFF) == 0xD8 && (content[2] & 0xFF) == 0xFF) return "jpg";
        if (content.length >= 8 && (content[0] & 0xFF) == 0x89 && content[1] == 'P' && content[2] == 'N' && content[3] == 'G'
                && content[4] == 0x0D && content[5] == 0x0A && content[6] == 0x1A && content[7] == 0x0A) return "png";
        if (content.length >= 12 && content[0] == 'R' && content[1] == 'I' && content[2] == 'F' && content[3] == 'F'
                && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P') return "webp";
        return null;
    }

    private String safeOriginalFileName(String originalFileName) {
        String fileName = originalFileName == null ? "photo" : originalFileName.replace('\\', '/');
        int separator = fileName.lastIndexOf('/');
        if (separator >= 0) fileName = fileName.substring(separator + 1);
        fileName = fileName.trim();
        if (fileName.isEmpty()) fileName = "photo";
        return fileName.length() <= 255 ? fileName : fileName.substring(fileName.length() - 255);
    }

    private String contentTypeFor(String extension) {
        return switch (extension.toLowerCase(Locale.ROOT)) {
            case "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> "image/webp";
        };
    }

    private Path fileForStoragePath(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return null;
        Path file = uploadRoot.resolve(storagePath).normalize();
        return file.startsWith(uploadRoot) ? file : null;
    }

    private void deleteStoredFile(String storagePath) {
        Path file = fileForStoragePath(storagePath);
        if (file != null) deleteFile(file);
    }

    private void deleteFile(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
            // Keep the original database or upload error.
        }
    }

    public record ImageFile(byte[] content, String contentType) { }
    private record ValidatedImage(byte[] content, String extension, String originalFileName) { }
}
