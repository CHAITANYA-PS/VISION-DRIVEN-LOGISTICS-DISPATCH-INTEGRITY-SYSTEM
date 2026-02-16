package com.visera.backend.DTOs;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BinCreateDTO {
    @NotNull(message = "Rack ID must not be null")
    private Long rackId;

    @NotBlank(message = "Name must not be blank")
    private String name;

    private String code; // Optional - can be auto-generated or left empty

    @NotNull(message = "Capacity must not be null")
    private Integer capacity;
}

