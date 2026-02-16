package com.visera.backend.Repository;

import com.visera.backend.Entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
//
//    List<Shipment> findByCreatedBy(Long userId);
//
//    List<Shipment> findByAssignedTo(Long userId);
//
//    List<Shipment> findByStatus(String status);

    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.shipmentType = :type AND s.createdAt BETWEEN :startDate AND :endDate")
    long countByShipmentTypeAndCreatedAtBetween(
            @Param("type") String shipmentType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    long countByCreatedAtBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
