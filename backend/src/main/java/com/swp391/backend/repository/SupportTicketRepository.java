package com.swp391.backend.repository;

import com.swp391.backend.entity.SupportTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    Optional<SupportTicket> findByTicketCode(String ticketCode);

    List<SupportTicket> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);

    List<SupportTicket> findByFacilityIdOrderByCreatedAtDesc(Integer facilityId);

    List<SupportTicket> findByFacilityIdAndStatusOrderByCreatedAtDesc(Integer facilityId, String status);

    List<SupportTicket> findByStatusAndType(String status, String type);
}
