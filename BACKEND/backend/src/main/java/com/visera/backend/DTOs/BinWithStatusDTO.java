package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class BinWithStatusDTO {
    private Long id;
    private String name;
    private String code;
    private Integer capacity;
    private Long rackId;
    private String rackName;
    private Boolean isOccupied;
    private Integer currentQuantity;
}







