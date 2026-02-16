package com.visera.backend.DTOs;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProductDTO {
    private long id;
    private String name;
    private String description;
    private String productCode;
    private String category;
    private String status;
    private long totalSkus;
    private LocalDateTime createdAt;
}

