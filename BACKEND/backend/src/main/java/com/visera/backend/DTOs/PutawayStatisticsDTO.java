package com.visera.backend.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PutawayStatisticsDTO {
    private int pendingCount;
    private int inProgressCount;
    private int completedTodayCount;
    private int totalItemsCount;
}
