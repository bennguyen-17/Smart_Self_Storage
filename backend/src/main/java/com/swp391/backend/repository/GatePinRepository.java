package com.swp391.backend.repository;

import com.swp391.backend.entity.GatePin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GatePinRepository extends JpaRepository<GatePin, Integer> {
    List<GatePin> findByContractId(Integer contractId);
    Optional<GatePin> findTopByContractIdAndStatusOrderByGeneratedAtDesc(Integer contractId, String status);
    List<GatePin> findByPinCodeAndStatus(String pinCode, String status);
}
