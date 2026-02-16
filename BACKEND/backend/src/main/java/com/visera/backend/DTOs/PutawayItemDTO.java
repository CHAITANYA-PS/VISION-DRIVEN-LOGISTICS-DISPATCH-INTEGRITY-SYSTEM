package com.visera.backend.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PutawayItemDTO {
    private Long id; // task id
    private Long shipmentItemId;
    private String skuCode;
    private String productName;
    private String category; // from product
    private Integer quantity;
    private String status; // PENDING, IN_PROGRESS
    private String suggestedLocation; // formatted
    private Long suggestedBinId;
    private Long suggestedZoneId;
    private String suggestedZoneName;
    private String suggestedRackName;
    private String suggestedBinCode;
    private Boolean hasOverflow; // true if quantity exceeds bin capacity
    private List<BinAllocation> allocationPlan; // if overflow, shows how to split
    private Integer availableCapacity; // available capacity in primary bin
    private Boolean hasError; // true if allocation failed
    private String errorMessage; // error message if allocation failed
    private Boolean zoneCapacityFull; // true if zone has no available capacity
    private Integer totalZoneCapacity; // total capacity in zone
    private Integer totalZoneAvailable; // total available capacity in zone
}
