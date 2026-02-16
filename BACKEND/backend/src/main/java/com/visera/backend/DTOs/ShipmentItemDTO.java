package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class ShipmentItemDTO {
    private long id;
    private long shipmentId;
    private long skuId;
    private int quantity;
    private String status;
    private String skuCode;
    private String productName;
    private String productCode;
    private String zoneName;
    private String rackName;
    private String binName;
    private String binCode;
}

