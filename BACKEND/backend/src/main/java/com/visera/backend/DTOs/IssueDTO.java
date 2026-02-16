package com.visera.backend.DTOs;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueDTO {
    private Long id;
    private Long shipmentId;
    
    // Reporter information
    private Long reportedById;
    private String reportedByName;
    private String reportedByEmail;
    
    // Issue details
    private String issueType; // MISMATCH, DAMAGED, LOCATION, OTHER
    private String description;
    private String status; // OPEN, NOTED
    
    // Acknowledgment information
    private Long acknowledgedById;
    private String acknowledgedByName;
    private LocalDateTime acknowledgedAt;
    
    // SKU mismatch details (if applicable)
    private String expectedSku;
    private String detectedSku;
    private Double confidence;
    
    // Timestamps
    private LocalDateTime createdAt;
}

