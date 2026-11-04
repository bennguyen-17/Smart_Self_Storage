package com.swp391.backend.dto;

import com.swp391.backend.entity.StoredImage;

import java.time.LocalDateTime;

public class StoredImageResponse {
    private Integer imageId;
    private Integer typeCode;
    private String imageSlot;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime uploadedAt;

    public StoredImageResponse(StoredImage image) {
        this.imageId = image.getImageId();
        this.typeCode = image.getTypeCode();
        this.imageSlot = image.getImageSlot();
        this.originalFileName = image.getOriginalFileName();
        this.contentType = image.getContentType();
        this.fileSize = image.getFileSize();
        this.uploadedAt = image.getUploadedAt();
    }

    public Integer getImageId() { return imageId; }
    public Integer getTypeCode() { return typeCode; }
    public String getImageSlot() { return imageSlot; }
    public String getOriginalFileName() { return originalFileName; }
    public String getContentType() { return contentType; }
    public Long getFileSize() { return fileSize; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
}
