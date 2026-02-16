package com.visera.backend.Service;

import com.visera.backend.DTOs.OCRVerificationResult;
import com.visera.backend.Entity.Approval;
import com.visera.backend.Entity.ShipmentItem;
import com.visera.backend.Entity.User;

import java.util.List;

public interface ApprovalService {
    Approval createApprovalRequest(ShipmentItem item, User worker, OCRVerificationResult result, String expectedData);
    List<Approval> getPendingApprovals();
    Approval approveRequest(Long approvalId, User supervisor);
    Approval rejectRequest(Long approvalId, User supervisor, String reason);
    Approval getApprovalById(Long id);
}






