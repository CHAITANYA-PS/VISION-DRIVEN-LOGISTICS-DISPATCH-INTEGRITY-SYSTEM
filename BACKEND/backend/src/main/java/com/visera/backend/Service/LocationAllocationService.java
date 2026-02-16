package com.visera.backend.Service;

import com.visera.backend.DTOs.LocationAllocationResult;
import com.visera.backend.Entity.Bin;
import com.visera.backend.Entity.Sku;

public interface LocationAllocationService {
    /**
     * Returns primary suggested bin for putaway
     */
    Bin suggestOptimalLocation(Sku sku, Integer quantity);

    /**
     * Handles capacity overflow and returns allocation plan
     */
    LocationAllocationResult allocateLocationWithOverflow(Sku sku, Integer quantity);
}
