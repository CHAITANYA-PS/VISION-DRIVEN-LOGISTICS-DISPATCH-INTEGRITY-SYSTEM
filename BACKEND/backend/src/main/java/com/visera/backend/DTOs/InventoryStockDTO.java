package com.visera.backend.DTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryStockDTO {
    private Long id;
    private Long skuId;
    private String skuCode;
    private String productName;
    private Long binId;
    private String binCode;
    private String binName;
    private String rackName;
    private String zoneName;
    private int quantity;
    private LocalDateTime updatedAt;
}







