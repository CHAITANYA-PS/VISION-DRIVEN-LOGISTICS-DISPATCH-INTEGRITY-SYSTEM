package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class InventoryStockRequest {
    private int skuId;
    private int binId;
    private int quantity;
}
