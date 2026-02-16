package com.visera.backend.Service;

import com.visera.backend.DTOs.VerificationSummaryDTO;
import com.visera.backend.Entity.Approval;
import com.visera.backend.Entity.VerificationLog;
import com.visera.backend.Repository.ApprovalRepository;
import com.visera.backend.Repository.VerificationLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VerificationLogServiceImpl implements VerificationLogService {

    private final VerificationLogRepository repo;
    
    @Autowired
    private ApprovalRepository approvalRepository;

    public VerificationLogServiceImpl(VerificationLogRepository repo) {
        this.repo = repo;
    }

    @Override
    public VerificationLog createLog(VerificationLog log) {
        return repo.save(log);
    }

    @Override
    public List<VerificationLog> getLogsByShipmentItem(int itemId) {
        return repo.findByShipmentItemId(itemId);
    }
    
    @Override
    public List<VerificationLog> getAllVerificationLogs() {
        return repo.findAll();
    }
    
    @Override
    public List<VerificationLog> getVerificationLogsWithFilters(String search, String operation, String result, String status) {
        List<VerificationLog> logs = repo.findAll();
        
        return logs.stream()
            .filter(log -> {
                // Search filter
                if (search != null && !search.isEmpty()) {
                    String searchLower = search.toLowerCase();
                    boolean matchesEmployee = log.getVerifiedBy() != null && 
                        (log.getVerifiedBy().getName().toLowerCase().contains(searchLower) ||
                         log.getVerifiedBy().getEmail().toLowerCase().contains(searchLower));
                    boolean matchesProduct = log.getShipmentItem() != null && 
                        log.getShipmentItem().getSku() != null &&
                        log.getShipmentItem().getSku().getProduct() != null &&
                        log.getShipmentItem().getSku().getProduct().getName().toLowerCase().contains(searchLower);
                    boolean matchesSku = log.getShipmentItem() != null && 
                        log.getShipmentItem().getSku() != null &&
                        log.getShipmentItem().getSku().getSkuCode().toLowerCase().contains(searchLower);
                    
                    if (!matchesEmployee && !matchesProduct && !matchesSku) {
                        return false;
                    }
                }
                
                // Operation filter
                if (operation != null && !operation.isEmpty() && !operation.equals("ALL")) {
                    String shipmentType = log.getShipmentItem().getShipment().getShipmentType();
                    if (!operation.equalsIgnoreCase(shipmentType)) {
                        return false;
                    }
                }
                
                // Result filter
                if (result != null && !result.isEmpty() && !result.equals("ALL")) {
                    if (!result.equalsIgnoreCase(log.getResult())) {
                        return false;
                    }
                }
                
                // Status filter
                if (status != null && !status.isEmpty() && !status.equals("ALL")) {
                    String logStatus = determineStatus(log);
                    if (!status.equalsIgnoreCase(logStatus)) {
                        return false;
                    }
                }
                
                return true;
            })
            .collect(Collectors.toList());
    }
    
    @Override
    public VerificationSummaryDTO getVerificationSummary() {
        List<VerificationLog> allLogs = repo.findAll();
        
        long totalVerifications = allLogs.size();
        
        long autoApproved = allLogs.stream()
            .filter(log -> "AUTO_APPROVED".equals(determineStatus(log)))
            .count();
        
        long pendingReview = allLogs.stream()
            .filter(log -> "PENDING".equals(determineStatus(log)))
            .count();
        
        double averageConfidence = allLogs.stream()
            .filter(log -> log.getAiConfidence() != null)
            .mapToDouble(VerificationLog::getAiConfidence)
            .average()
            .orElse(0.0);
        
        return VerificationSummaryDTO.builder()
            .totalVerifications(totalVerifications)
            .autoApproved(autoApproved)
            .pendingReview(pendingReview)
            .averageConfidence(averageConfidence)
            .build();
    }
    
    private String determineStatus(VerificationLog log) {
        List<Approval> approvals = approvalRepository.findByShipmentItemId(log.getShipmentItem().getId());
        
        if (approvals != null && !approvals.isEmpty()) {
            Approval approval = approvals.get(0);
            String approvalStatus = approval.getStatus();
            
            if ("PENDING".equals(approvalStatus)) {
                return "PENDING";
            } else if ("APPROVED".equals(approvalStatus)) {
                return "SUPERVISOR_APPROVED";
            } else if ("REJECTED".equals(approvalStatus)) {
                return "REJECTED";
            }
        }
        
        // No approval exists
        if ("MATCH".equals(log.getResult())) {
            return "AUTO_APPROVED";
        } else {
            return "PENDING";
        }
    }
    
    @Override
    @Transactional
    public VerificationLog updateVerificationLog(Long id, VerificationLog updatedLog) {
        Optional<VerificationLog> existingLogOpt = repo.findById(id.intValue());
        
        if (existingLogOpt.isEmpty()) {
            throw new RuntimeException("Verification log not found with id: " + id);
        }
        
        VerificationLog existingLog = existingLogOpt.get();
        
        // Update editable fields
        if (updatedLog.getResult() != null) {
            existingLog.setResult(updatedLog.getResult());
        }
        if (updatedLog.getAiConfidence() != null) {
            existingLog.setAiConfidence(updatedLog.getAiConfidence());
        }
        if (updatedLog.getExtractedSku() != null) {
            existingLog.setExtractedSku(updatedLog.getExtractedSku());
        }
        if (updatedLog.getExtractedProductCode() != null) {
            existingLog.setExtractedProductCode(updatedLog.getExtractedProductCode());
        }
        if (updatedLog.getExtractedWeight() != null) {
            existingLog.setExtractedWeight(updatedLog.getExtractedWeight());
        }
        if (updatedLog.getExtractedColor() != null) {
            existingLog.setExtractedColor(updatedLog.getExtractedColor());
        }
        if (updatedLog.getExtractedDimensions() != null) {
            existingLog.setExtractedDimensions(updatedLog.getExtractedDimensions());
        }
        
        return repo.save(existingLog);
    }
    
    @Override
    @Transactional
    public void deleteVerificationLog(Long id) {
        if (!repo.existsById(id.intValue())) {
            throw new RuntimeException("Verification log not found with id: " + id);
        }
        repo.deleteById(id.intValue());
    }
}

