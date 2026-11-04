package com.swp391.backend.repository;

import com.swp391.backend.entity.StoredImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoredImageRepository extends JpaRepository<StoredImage, Integer> {

    List<StoredImage> findByFacilityIdAndImageStatusOrderByCategoryAsc(Integer facilityId, String imageStatus);

    Optional<StoredImage> findByFacilityIdAndCategoryAndImageStatus(Integer facilityId, String category, String imageStatus);

    List<StoredImage> findByContractIdAndCategoryOrderByUploadedAtAscImageIdAsc(Integer contractId, String category);

    List<StoredImage> findByContractIdAndCategoryInOrderByUploadedAtAscImageIdAsc(Integer contractId, List<String> categories);

    List<StoredImage> findByPaymentIdAndCategoryOrderByUploadedAtAscImageIdAsc(Integer paymentId, String category);
}
