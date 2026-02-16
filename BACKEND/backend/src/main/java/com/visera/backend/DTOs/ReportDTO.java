package com.visera.backend.DTOs;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportDTO {

    // Summary statistics
    private long totalShipments;
    private long totalMismatches;
    private long totalUsers;
    private long totalSkus;

    // Monthly shipment trends
    private List<MonthlyShipmentData> shipmentTrends;

    // User role distribution
    private List<RoleDistribution> roleDistribution;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MonthlyShipmentData {
        private String month;
        private long inbound;
        private long outbound;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RoleDistribution {
        private String name;
        private long value;
    }
}
