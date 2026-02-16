package com.visera.backend.Repository;

import com.visera.backend.Entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserId(Long userId);

//    List<Task> findByStatus(String status);

    List<Task> findByShipmentItemId(Long shipmentItemId);

//    List<Task> findByUserIdAndTaskTypeAndStatusNot(Long userId, String taskType, String status);
//
//    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.taskType = :taskType AND t.status = :status AND t.createdAt >= :date")
//    List<Task> findByUserIdAndTaskTypeAndStatusAndCreatedAtAfter(
//            @Param("userId") Long userId,
//            @Param("taskType") String taskType,
//            @Param("status") String status,
//            @Param("date") LocalDateTime date);
//
//    long countByUserIdAndTaskTypeAndStatus(Long userId, String taskType, String status);

    // Putaway tasks for INBOUND shipments only
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.taskType = :taskType AND t.status != :status AND t.shipmentItem.shipment.shipmentType = 'INBOUND'")
    List<Task> findPutawayTasksByUserForInbound(
            @Param("userId") Long userId,
            @Param("taskType") String taskType,
            @Param("status") String status);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.taskType = :taskType AND t.status = :status AND t.createdAt >= :date AND t.shipmentItem.shipment.shipmentType = 'INBOUND'")
    List<Task> findCompletedPutawayTasksTodayForInbound(
            @Param("userId") Long userId,
            @Param("taskType") String taskType,
            @Param("status") String status,
            @Param("date") LocalDateTime date);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.taskType = :taskType AND t.status = :status AND t.shipmentItem.shipment.shipmentType = 'INBOUND'")
    long countPutawayTasksByUserAndStatusForInbound(
            @Param("userId") Long userId,
            @Param("taskType") String taskType,
            @Param("status") String status);

    // Picking tasks for OUTBOUND shipments only
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.taskType = :taskType AND t.status != :status AND t.shipmentItem.shipment.shipmentType = 'OUTBOUND'")
    List<Task> findPickingTasksByUserForOutbound(
            @Param("userId") Long userId,
            @Param("taskType") String taskType,
            @Param("status") String status);

    @Query("SELECT t FROM Task t WHERE t.taskType = :taskType AND t.status != :status AND t.shipmentItem.shipment.shipmentType = 'OUTBOUND'")
    List<Task> findAllPickingTasksForOutbound(
            @Param("taskType") String taskType,
            @Param("status") String status);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.taskType = :taskType AND t.status = :status AND t.createdAt >= :date AND t.shipmentItem.shipment.shipmentType = 'OUTBOUND'")
    List<Task> findCompletedPickingTasksTodayForOutbound(
            @Param("userId") Long userId,
            @Param("taskType") String taskType,
            @Param("status") String status,
            @Param("date") LocalDateTime date);

//    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId AND t.taskType = :taskType AND t.status = :status AND t.shipmentItem.shipment.shipmentType = 'OUTBOUND'")
//    long countPickingTasksByUserAndStatusForOutbound(
//            @Param("userId") Long userId,
//            @Param("taskType") String taskType,
//            @Param("status") String status);

    @Query("SELECT t FROM Task t WHERE t.taskType = :taskType AND t.status = :status AND t.shipmentItem.shipment.shipmentType = 'OUTBOUND'")
    List<Task> findCompletedPickingTasksForOutbound(
            @Param("taskType") String taskType,
            @Param("status") String status);
}

