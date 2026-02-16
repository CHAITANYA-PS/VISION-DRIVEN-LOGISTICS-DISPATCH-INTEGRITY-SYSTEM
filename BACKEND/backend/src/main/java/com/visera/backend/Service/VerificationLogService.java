package com.visera.backend.Service;

import com.visera.backend.DTOs.VerificationSummaryDTO;
import com.visera.backend.Entity.VerificationLog;

import java.util.List;

public interface VerificationLogService {
    VerificationLog createLog(VerificationLog log);
    List<VerificationLog> getLogsByShipmentItem(int shipmentItemId);
    List<VerificationLog> getAllVerificationLogs();
    List<VerificationLog> getVerificationLogsWithFilters(String search, String operation, String result, String status);
    VerificationSummaryDTO getVerificationSummary();
    VerificationLog updateVerificationLog(Long id, VerificationLog updatedLog);
    void deleteVerificationLog(Long id);
}
