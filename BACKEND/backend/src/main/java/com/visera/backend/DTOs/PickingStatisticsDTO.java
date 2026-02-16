package com.visera.backend.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickingStatisticsDTO {
    private int activePickListsCount; // Number of shipments with pending picking tasks
    private int itemsToPickCount; // Total quantity of items in pending picking tasks
    private int pickedTodayCount; // Items picked today (completed picking tasks)
    private int readyToShipCount; // Shipment items with status DISPATCHED
}



