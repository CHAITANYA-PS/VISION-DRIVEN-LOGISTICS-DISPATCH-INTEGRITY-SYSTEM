package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class RackWithBinsDTO {
    private Long id;
    private String name;
    private String description;
    private Long zoneId;
    private String zoneName;
    private Long binCount;
}







