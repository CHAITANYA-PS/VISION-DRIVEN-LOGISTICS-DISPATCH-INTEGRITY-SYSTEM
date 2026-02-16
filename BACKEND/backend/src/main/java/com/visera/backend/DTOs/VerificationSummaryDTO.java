package com.visera.backend.DTOs;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationSummaryDTO {
    private long totalVerifications;
    private long autoApproved;
    private long pendingReview;
    private double averageConfidence;
}





