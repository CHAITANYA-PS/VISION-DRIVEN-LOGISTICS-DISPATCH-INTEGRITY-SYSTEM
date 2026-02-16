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
public class ZoneProductAllocationDTO {
    private Long skuId;
    private String skuCode;
    private String productName;
    private Integer totalQuantity;
    private List<BinAllocationDTO> binAllocations;
}















