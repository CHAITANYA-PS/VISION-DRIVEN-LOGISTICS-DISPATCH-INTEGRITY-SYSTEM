package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class SkuDTO {
    private long id;
    private String skuCode;
    private String color;
    private String dimensions;
    private String weight;
    private long productId;
    private String productName; // NEW: Product name
    private int totalQuantity; // NEW: Sum of all inventory stock quantities
    private String binLocation; // NEW: Primary bin location code
    private String status; // NEW: "In Stock" or "Low Stock"
}
