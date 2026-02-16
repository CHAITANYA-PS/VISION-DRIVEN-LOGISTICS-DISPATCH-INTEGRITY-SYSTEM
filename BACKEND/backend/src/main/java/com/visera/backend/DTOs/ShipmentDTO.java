package com.visera.backend.DTOs;

import com.visera.backend.Entity.User;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ShipmentDTO {
    private long id;
    private String shipmentType;
    private String status;
    private User createdBy;
    private User assignedTo;
    private LocalDate deadline;
    private LocalDateTime createdAt;
    private List<UserDTO> assignedWorkers;
    private int packageCount;
    private int verifiedCount;
}

