package com.visera.backend.Repository;

import com.visera.backend.Entity.User;
import com.visera.backend.Entity.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface VerificationLogRepository extends JpaRepository<VerificationLog, Integer> {

    List<VerificationLog> findByShipmentItemId(int shipmentItemId);

//    List<VerificationLog> findByVerifiedBy_Id(int userId);

    List<VerificationLog> findByShipmentItemIdIn(List<Long> shipmentItemIds);

//    long countByResult(String result);

//    @Query("SELECT COUNT(v) FROM VerificationLog v WHERE v.result = :result AND v.verifiedAt BETWEEN :startDate AND :endDate")
//    long countByResultAndVerifiedAtBetween(
//            @Param("result") String result,
//            @Param("startDate") LocalDateTime startDate,
//            @Param("endDate") LocalDateTime endDate);
//
//    @Query("SELECT COUNT(v) FROM VerificationLog v WHERE (v.result IS NULL OR v.result != 'MATCH') AND v.verifiedAt BETWEEN :startDate AND :endDate")
//    long countNonMatchResultsAndVerifiedAtBetween(
//            @Param("startDate") LocalDateTime startDate,
//            @Param("endDate") LocalDateTime endDate);
//
//    @Query("SELECT COUNT(v) FROM VerificationLog v WHERE v.result IS NULL OR v.result != 'MATCH'")
//    long countNonMatchResults();
}
