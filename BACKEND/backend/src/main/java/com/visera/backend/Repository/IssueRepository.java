package com.visera.backend.Repository;

import com.visera.backend.Entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
//
//    List<Issue> findByStatus(String status);
//
//    List<Issue> findByReportedById(Long userId);

    List<Issue> findByStatusOrderByCreatedAtDesc(String status);

    List<Issue> findAllByOrderByCreatedAtDesc();

    List<Issue> findByShipmentId(Long shipmentId);
}

