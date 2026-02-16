package com.visera.backend.DTOs;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationResponse {
    private String status; // SUCCESS, MISMATCH, ERROR
    private String message;
    private boolean matched;
    private boolean autoAssigned;
    private Long approvalRequestId;
    private VerificationDetails details;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerificationDetails {
        private String extractedProductCode;
        private String expectedProductCode;
        private String extractedSku;
        private String expectedSku;
        private String extractedWeight;
        private String expectedWeight;
        private String extractedColor;
        private String expectedColor;
        private String extractedDimensions;
        private String expectedDimensions;
        private double confidence;
        private String[] issues;
        private String binLocation;
    }
}






