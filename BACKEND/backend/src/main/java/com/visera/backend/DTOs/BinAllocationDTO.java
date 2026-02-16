package com.visera.backend.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BinAllocationDTO {
    private Long binId;
    private String binCode;
    private String binName;
    private String rackName;
    private Integer quantity;
}















