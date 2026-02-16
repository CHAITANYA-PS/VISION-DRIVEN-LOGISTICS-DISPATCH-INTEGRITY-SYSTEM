package com.visera.backend.DTOs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RackCreateDTO {
    @NotNull(message = "Zone ID must not be null")
    private Long zoneId;

    @NotBlank(message = "Name must not be blank")
    private String name;

    private String description;
}







