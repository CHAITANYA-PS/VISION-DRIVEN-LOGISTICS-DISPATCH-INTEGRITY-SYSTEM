package com.visera.backend.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BinAllocation {
    private Long binId;
    private String binCode;
    private String binName;
    private Integer quantity; // quantity to store in this bin
    private Integer availableCapacity; // available capacity in this bin
}
