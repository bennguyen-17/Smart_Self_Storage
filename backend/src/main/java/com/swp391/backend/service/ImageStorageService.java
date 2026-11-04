package com.swp391.backend.service;

import com.swp391.backend.dto.StoredImageResponse;
import com.swp391.backend.entity.Contract;
import com.swp391.backend.entity.EmployeeProfile;
import com.swp391.backend.entity.Floor;
import com.swp391.backend.entity.Reservation;
import com.swp391.backend.entity.StorageUnit;
import com.swp391.backend.entity.StoredImage;
import com.swp391.backend.repository.ContractRepository;
import com.swp391.backend.repository.EmployeeProfileRepository;
import com.swp391.backend.repository.FacilityRepository;
import com.swp391.backend.repository.FloorRepository;
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

    private static final int MAX_INSPECTION_PHOTOS = 5;
    private static final long MAX_PHOTO_SIZE = 5 * 1024 * 1024;
    private static final String CHECKOUT_INSPECTION_SLOT = "CHECKOUT_INSPECTION";
    private static final Set<String> FACILITY_IMAGE_SLOTS = Set.of(
            "COVER", "ALL_UNITS", "NORMAL_UNIT", "CLIMATE_UNIT");

    private final StoredImageRepository storedImageRepository;
    private final FacilityRepository facilityRepository;
    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FloorRepository floorRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final Path facilityImageDirectory;
    private final Path inspectionPhotoDirectory;
    private final Path uploadRoot;

    public ImageStorageService(
            StoredImageRepository storedImageRepository,
            FacilityRepository facilityRepository,
            ContractRepository contractRepository,
            ReservationRepository reservationRepository,
            StorageUnitRepository storageUnitRepository,
            FloorRepository floorRepository,
            EmployeeProfileRepository employeeProfileRepository,
            @Value("${app.upload.root-dir:uploads}") String uploadRoot,
            @Value("${app.upload.facility-image-dir:${app.upload.root-dir:uploads}/facilities}") String facilityImageDirectory,
            @Value("${app.upload.inspection-photo-dir:${app.upload.root-dir:uploads}/inspection-photos}") String inspectionPhotoDirectory) {
        this.storedImageRepository = storedImageRepository;
        this.facilityRepository = facilityRepository;
        this.contractRepository = contractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.floorRepository = floorRepository;
        this.employeeProfileRepository = employeeProfileRepository;
        this.uploadRoot = Path.of(uploadRoot).toAbsolutePath().normalize();
        this.facilityImageDirectory = resolveConfiguredDirectory(facilityImageDirectory);
        this.inspectionPhotoDirectory = resolveConfiguredDirectory(inspectionPhotoDirectory);
    }

    @Transactional
    public StoredImage storeFacilityImage(
            Integer facilityId, String imageSlot, Integer uploaderAccountId, MultipartFile file) {
        if (!FACILITY_IMAGE_SLOTS.contains(imageSlot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vị trí ảnh cơ sở không hợp lệ.");
        }
        if (!facilityRepository.existsById(facilityId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cơ sở.");
        }

        ValidatedImage validated = validateImage(file);
        Path targetDirectory = facilityImageDirectory.resolve(facilityId.toString()).resolve(imageSlot);
        StoredImage previousImage = storedImageRepository
                .findByFacilityIdAndImageSlot(facilityId, imageSlot)
                .orElse(null);
        String previousStoragePath = previousImage != null ? previousImage.getStoragePath() : null;

        StoredImage storedImage = previousImage != null ? previousImage : new StoredImage();
        storedImage.setTypeCode(StoredImage.TYPE_FACILITY);
        storedImage.setFacilityId(facilityId);
        storedImage.setImageSlot(imageSlot);
        storedImage.setUploadedBy(uploaderAccountId);
        storedImage.setUploadedAt(LocalDateTime.now());
        setFileMetadata(storedImage, validated);

        Path createdFile = writeImage(targetDirectory, validated);
        storedImage.setStoragePath(toStoragePath(createdFile));
        try {
            StoredImage savedImage = storedImageRepository.saveAndFlush(storedImage);
            if (previousImage != null) {
                deleteStoredFile(previousStoragePath);
            }
            return savedImage;
        } catch (RuntimeException ex) {
            deleteFile(createdFile);
            throw ex;
        }
    }

    @Transactional
    public List<StoredImage> storeCheckoutInspectionPhotos(
            Integer contractId, Integer staffAccountId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng tải lên ít nhất một ảnh nghiệm thu.");
        }
        if (files.size() > MAX_INSPECTION_PHOTOS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tối đa 5 ảnh cho mỗi lần nghiệm thu.");
        }

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."));
        EmployeeProfile employee = employeeProfileRepository.findByAccountId(staffAccountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Không tìm thấy hồ sơ nhân viên."));
        Integer contractFacilityId = findContractFacilityId(contract);
        if (!employee.getFacilityId().equals(contractFacilityId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Nhân viên không thuộc cơ sở của hợp đồng này.");
        }

        List<ValidatedImage> validatedImages = files.stream().map(this::validateImage).toList();
        List<Path> createdFiles = new ArrayList<>();
        List<StoredImage> storedImages = new ArrayList<>();
        try {
            for (ValidatedImage validated : validatedImages) {
                Path createdFile = writeImage(
                        inspectionPhotoDirectory.resolve(contractId.toString()), validated);
                createdFiles.add(createdFile);

                StoredImage storedImage = new StoredImage();
                storedImage.setTypeCode(StoredImage.TYPE_CHECKOUT_INSPECTION);
                storedImage.setContractId(contractId);
                storedImage.setImageSlot(CHECKOUT_INSPECTION_SLOT);
                storedImage.setUploadedBy(staffAccountId);
                storedImage.setUploadedAt(LocalDateTime.now());
                storedImage.setStoragePath(toStoragePath(createdFile));
                setFileMetadata(storedImage, validated);
                storedImages.add(storedImage);
            }
            return storedImageRepository.saveAllAndFlush(storedImages);
        } catch (RuntimeException ex) {
            createdFiles.forEach(this::deleteFile);
            throw ex;
        }
    }

    public Map<String, StoredImageResponse> getFacilityImageResponses(Integer facilityId) {
        Map<String, StoredImageResponse> images = new LinkedHashMap<>();
        storedImageRepository.findByFacilityIdOrderByImageSlotAsc(facilityId)
                .forEach(image -> images.put(image.getImageSlot(), new StoredImageResponse(image)));
        return images;
    }

    public List<StoredImageResponse> getCheckoutImageResponses(Integer contractId) {
        return storedImageRepository.findByContractIdOrderByUploadedAtAscImageIdAsc(contractId).stream()
                .map(StoredImageResponse::new)
                .toList();
    }

    public ImageFile loadImage(Integer imageId, Integer accountId, Collection<String> authorities) {
        StoredImage image = storedImageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh."));

        if (image.getTypeCode() == StoredImage.TYPE_CHECKOUT_INSPECTION
                && !canViewCheckoutImage(image, accountId, authorities)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem ảnh nghiệm thu này.");
        }

        Path file = uploadRoot.resolve(image.getStoragePath()).normalize();
        if (!file.startsWith(uploadRoot) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy file ảnh.");
        }
        try {
            return new ImageFile(Files.readAllBytes(file), image.getContentType());
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể đọc file ảnh.", ex);
        }
    }

    private boolean canViewCheckoutImage(
            StoredImage image, Integer accountId, Collection<String> authorities) {
        if (accountId == null) {
            return false;
        }
        if (hasAuthority(authorities, "ROLE_ADMIN")) {
            return true;
        }

        Contract contract = contractRepository.findById(image.getContractId()).orElse(null);
        if (contract == null) {
            return false;
        }
        Reservation reservation = reservationRepository.findById(contract.getReservationId()).orElse(null);
        if (reservation == null) {
            return false;
        }
        if (accountId.equals(reservation.getAccountId())) {
            return true;
        }

        boolean isStaffOrManager = hasAuthority(authorities, "ROLE_STAFF")
                || hasAuthority(authorities, "ROLE_MANAGER");
        if (!isStaffOrManager) {
            return false;
        }
        EmployeeProfile employee = employeeProfileRepository.findByAccountId(accountId).orElse(null);
        if (employee == null) {
            return false;
        }
        return employee.getFacilityId().equals(findContractFacilityId(contract));
    }

    private boolean hasAuthority(Collection<String> authorities, String expected) {
        return authorities != null && authorities.contains(expected);
    }

    private Integer findContractFacilityId(Contract contract) {
        Reservation reservation = reservationRepository.findById(contract.getReservationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông tin đặt chỗ của hợp đồng."));
        StorageUnit unit = storageUnitRepository.findById(reservation.getUnitCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy ô kho của hợp đồng."));
        Floor floor = floorRepository.findById(unit.getFloorId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy tầng của hợp đồng."));
        return floor.getFacilityId();
    }

    private ValidatedImage validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh tải lên không được để trống.");
        }
        if (file.getSize() > MAX_PHOTO_SIZE) {
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

    private Path writeImage(Path directory, ValidatedImage image) {
        Path normalizedDirectory = directory.toAbsolutePath().normalize();
        if (!normalizedDirectory.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Đường dẫn lưu ảnh không hợp lệ.");
        }

        Path destination = normalizedDirectory.resolve(UUID.randomUUID() + "." + image.extension()).normalize();
        if (!destination.startsWith(normalizedDirectory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên file ảnh không hợp lệ.");
        }
        try {
            Files.createDirectories(normalizedDirectory);
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
        return uploadRoot.relativize(file).toString().replace('\\', '/');
    }

    private void setFileMetadata(StoredImage storedImage, ValidatedImage image) {
        storedImage.setOriginalFileName(image.originalFileName());
        storedImage.setContentType(contentTypeFor(image.extension()));
        storedImage.setFileSize((long) image.content().length);
    }

    private String detectImageExtension(byte[] content) {
        if (content.length >= 3
                && (content[0] & 0xFF) == 0xFF
                && (content[1] & 0xFF) == 0xD8
                && (content[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (content.length >= 8
                && (content[0] & 0xFF) == 0x89
                && content[1] == 'P' && content[2] == 'N' && content[3] == 'G'
                && content[4] == 0x0D && content[5] == 0x0A
                && content[6] == 0x1A && content[7] == 0x0A) {
            return "png";
        }
        if (content.length >= 12
                && content[0] == 'R' && content[1] == 'I' && content[2] == 'F' && content[3] == 'F'
                && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P') {
            return "webp";
        }
        return null;
    }

    private String safeOriginalFileName(String originalFileName) {
        String fileName = originalFileName == null ? "photo" : originalFileName.replace('\\', '/');
        int separator = fileName.lastIndexOf('/');
        if (separator >= 0) {
            fileName = fileName.substring(separator + 1);
        }
        fileName = fileName.trim();
        if (fileName.isEmpty()) {
            fileName = "photo";
        }
        return fileName.length() <= 255 ? fileName : fileName.substring(fileName.length() - 255);
    }

    private String contentTypeFor(String extension) {
        return switch (extension.toLowerCase(Locale.ROOT)) {
            case "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> "image/webp";
        };
    }

    private void deleteStoredFile(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return;
        }
        Path file = uploadRoot.resolve(storagePath).normalize();
        if (file.startsWith(uploadRoot)) {
            deleteFile(file);
        }
    }

    private void deleteFile(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
            // Preserve the original upload or database error.
        }
    }

    private record ValidatedImage(byte[] content, String extension, String originalFileName) {
    }

    public record ImageFile(byte[] content, String contentType) {
    }
}
