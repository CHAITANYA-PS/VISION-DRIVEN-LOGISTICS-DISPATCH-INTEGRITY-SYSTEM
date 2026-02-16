package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class SkuRequest {
    private Long productId;
    private String skuCode;
    private String color;
    private String dimensions;
    private String weight;
    private Long binId;
    private Integer initialQuantity;
}

