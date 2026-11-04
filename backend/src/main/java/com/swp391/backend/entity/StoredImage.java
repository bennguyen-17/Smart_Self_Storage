package com.swp391.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "StoredImage")
public class StoredImage {

    public static final int TYPE_FACILITY = 1;
    public static final int TYPE_CHECKOUT_INSPECTION = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "imageId")
    private Integer imageId;

    @Column(name = "typeCode", nullable = false)
    private Integer typeCode;

    @Column(name = "facilityId")
    private Integer facilityId;

    @Column(name = "contractId")
    private Integer contractId;

    @Column(name = "imageSlot", nullable = false, length = 40)
    private String imageSlot;

    @Column(name = "storagePath", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "originalFileName", nullable = false, length = 255)
    private String originalFileName;

    @Column(name = "contentType", nullable = false, length = 100)
    private String contentType;

    @Column(name = "fileSize", nullable = false)
    private Long fileSize;

    @Column(name = "uploadedBy")
    private Integer uploadedBy;

    @Column(name = "uploadedAt", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    public StoredImage() {
    }

    public Integer getImageId() {
        return imageId;
    }

    public void setImageId(Integer imageId) {
        this.imageId = imageId;
    }

    public Integer getTypeCode() {
        return typeCode;
    }

    public void setTypeCode(Integer typeCode) {
        this.typeCode = typeCode;
    }

    public Integer getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Integer facilityId) {
        this.facilityId = facilityId;
    }

    public Integer getContractId() {
        return contractId;
    }

    public void setContractId(Integer contractId) {
        this.contractId = contractId;
    }

    public String getImageSlot() {
        return imageSlot;
    }

    public void setImageSlot(String imageSlot) {
        this.imageSlot = imageSlot;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Integer getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(Integer uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
