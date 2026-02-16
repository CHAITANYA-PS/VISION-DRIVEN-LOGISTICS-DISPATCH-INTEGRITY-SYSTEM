package com.visera.backend.DTOs;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentCompletionDTO {
    private Long taskId;
    private String skuCode;
    private String productName;
    private String location; // bin code format
    private LocalDateTime completedAt;
}
