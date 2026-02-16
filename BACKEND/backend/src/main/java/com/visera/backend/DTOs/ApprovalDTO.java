package com.visera.backend.DTOs;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ApprovalDTO {
    private long id;
    private long shipmentItemId;
    private String shipmentItemName;
    private long requestedById;
    private String requestedByName;
    private String type;
    private String status;
    private String reason;
    private String extractedData;
    private String expectedData;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
}






