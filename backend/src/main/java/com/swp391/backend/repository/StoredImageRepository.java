package com.swp391.backend.repository;

import com.swp391.backend.entity.StoredImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoredImageRepository extends JpaRepository<StoredImage, Integer> {

    List<StoredImage> findByFacilityIdOrderByImageSlotAsc(Integer facilityId);

    Optional<StoredImage> findByFacilityIdAndImageSlot(Integer facilityId, String imageSlot);

    List<StoredImage> findByContractIdOrderByUploadedAtAscImageIdAsc(Integer contractId);
}
