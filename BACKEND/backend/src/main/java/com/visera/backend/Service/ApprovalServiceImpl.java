package com.visera.backend.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visera.backend.DTOs.OCRVerificationResult;
import com.visera.backend.Entity.Approval;
import com.visera.backend.Entity.ShipmentItem;
import com.visera.backend.Entity.User;
import com.visera.backend.Repository.ApprovalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApprovalServiceImpl implements ApprovalService {

    private final ApprovalRepository approvalRepository;
    private final ObjectMapper objectMapper;
    private final NotificationEventService notificationEventService;

    public ApprovalServiceImpl(
            ApprovalRepository approvalRepository,
            NotificationEventService notificationEventService) {
        this.approvalRepository = approvalRepository;
        this.objectMapper = new ObjectMapper();
        this.notificationEventService = notificationEventService;
    }

    @Override
    @Transactional
    public Approval createApprovalRequest(ShipmentItem item, User worker, OCRVerificationResult result, String expectedData) {
        try {
            String extractedDataJson = objectMapper.writeValueAsString(result.getData());
            
            Approval approval = Approval.builder()
                .shipmentItem(item)
                .requestedBy(worker)
                .type("VERIFICATION_MISMATCH")
                .status("PENDING")
                .reason(String.join(", ", result.getIssues()))
                .extractedData(extractedDataJson)
                .expectedData(expectedData)
                .build();
            
            Approval savedApproval = approvalRepository.save(approval);
            
            // Send real-time notification to supervisors
            notificationEventService.notifyNewApproval(savedApproval);
            
            return savedApproval;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create approval request: " + e.getMessage());
        }
    }

    @Override
    public List<Approval> getPendingApprovals() {
        return approvalRepository.findByStatus("PENDING");
    }

    @Override
    @Transactional
    public Approval approveRequest(Long approvalId, User supervisor) {
        Approval approval = approvalRepository.findById(approvalId)
            .orElseThrow(() -> new RuntimeException("Approval not found with id: " + approvalId));
        
        if (!"PENDING".equals(approval.getStatus())) {
            throw new RuntimeException("Approval request is not pending");
        }
        
        approval.setStatus("APPROVED");
        approval.setReviewedBy(supervisor);
        approval.setReviewedAt(LocalDateTime.now());
        
        return approvalRepository.save(approval);
    }

    @Override
    @Transactional
    public Approval rejectRequest(Long approvalId, User supervisor, String reason) {
        Approval approval = approvalRepository.findById(approvalId)
            .orElseThrow(() -> new RuntimeException("Approval not found with id: " + approvalId));
        
        if (!"PENDING".equals(approval.getStatus())) {
            throw new RuntimeException("Approval request is not pending");
        }
        
        approval.setStatus("REJECTED");
        approval.setReviewedBy(supervisor);
        approval.setReviewedAt(LocalDateTime.now());
        if (reason != null && !reason.isEmpty()) {
            approval.setReason(approval.getReason() + " | Rejection reason: " + reason);
        }
        
        return approvalRepository.save(approval);
    }

    @Override
    public Approval getApprovalById(Long id) {
        return approvalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Approval not found with id: " + id));
    }
}






