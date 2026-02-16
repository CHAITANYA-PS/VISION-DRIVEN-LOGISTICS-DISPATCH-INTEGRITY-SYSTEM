package com.visera.backend.DTOs;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationDTO {
    // Log identification
    private Long id;
    private LocalDateTime timestamp;
    
    // Employee information
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    
    // Operation information
    private String operation; // INBOUND, OUTBOUND, PUTAWAY
    
    // Product and SKU information
    private Long productId;
    private String productName;
    private String productCode;
    private Long skuId;
    private String skuCode;
    
    // Verification data
    private String extractedSku;
    private String expectedSku;
    private String extractedProductCode;
    private String expectedProductCode;
    private String extractedWeight;
    private String expectedWeight;
    private String extractedColor;
    private String expectedColor;
    private String extractedDimensions;
    private String expectedDimensions;
    
    // AI results
    private Double aiConfidence;
    private String result; // MATCH, MISMATCH, LOW_CONFIDENCE
    
    // Status and approval
    private String status; // AUTO_APPROVED, SUPERVISOR_APPROVED, REJECTED, PENDING
    private Long approvalId;
    
    // Reference
    private Long shipmentItemId;
}
