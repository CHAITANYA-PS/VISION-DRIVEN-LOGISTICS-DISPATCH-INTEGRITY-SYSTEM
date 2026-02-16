package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class ZoneStatisticsDTO {
    private Long zoneId;
    private String zoneName;
    private String description;
    private long totalRacks;
    private long totalBins;
    private long occupiedBins;
    private double occupancyPercentage;
}









