package com.visera.backend.Repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.visera.backend.Entity.Approval;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByStatus(String status);
//    List<Approval> findByRequestedById(Long userId);
    List<Approval> findByShipmentItemId(Long shipmentItemId);
    
    @Query("SELECT COUNT(a) FROM Approval a WHERE a.type = 'VERIFICATION_MISMATCH' AND a.requestedAt BETWEEN :startDate AND :endDate")
    long countVerificationMismatchesByRequestedAtBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(a) FROM Approval a WHERE a.type = 'VERIFICATION_MISMATCH'")
    long countVerificationMismatches();
}






