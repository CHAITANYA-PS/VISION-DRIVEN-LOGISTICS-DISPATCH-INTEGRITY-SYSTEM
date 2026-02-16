package com.visera.backend.DTOs;

import com.visera.backend.Entity.Bin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationAllocationResult {
    private Bin primaryBin; // main suggested bin
    private String suggestedLocation; // formatted location string
    private List<BinAllocation> binAllocations; // list of bins with quantities
    private Long zoneId;
    private String zoneName;
    private Boolean hasError; // true if allocation failed
    private String errorMessage; // error message if allocation failed
    private Boolean zoneCapacityFull; // true if zone has no available capacity
    private Integer totalZoneCapacity; // total capacity in zone
    private Integer totalZoneUsed; // total used capacity in zone
    private Integer totalZoneAvailable; // total available capacity in zone
}
