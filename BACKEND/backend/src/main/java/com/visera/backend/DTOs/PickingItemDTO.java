package com.visera.backend.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickingItemDTO {
    private Long id;
    private Long shipmentItemId;
    private String skuCode;
    private String productName;
    private String category;
    private Integer quantity;
    
    // Location information
    private Long suggestedBinId;
    private String suggestedBinCode;
    private String suggestedRackName;
    private Long suggestedZoneId;
    private String suggestedZoneName;
    private String suggestedLocation;
    
    // Task status
    private String status;
    
    // Shipment information
    private Long shipmentId;
    private LocalDate shipmentDeadline;
    private String orderNumber; // Can be null if not available
    private String destination; // Can be null if not available
    
    // Assignment information
    private Long assignedToUserId;
    private String assignedToUserName;
    private Boolean isAssignedToMe; // For UI to enable/disable actions
    
    // Stock information
    private Integer availableStock; // Available stock in suggested bin
    private Boolean hasInsufficientStock; // True if availableStock < quantity
}

