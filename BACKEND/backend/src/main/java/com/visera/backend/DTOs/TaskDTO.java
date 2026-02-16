package com.visera.backend.DTOs;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TaskDTO {
    private long id;
    private long userId;
    private long shipmentItemId;
    private String taskType;
    private String status;
    private LocalDateTime createdAt;
}
