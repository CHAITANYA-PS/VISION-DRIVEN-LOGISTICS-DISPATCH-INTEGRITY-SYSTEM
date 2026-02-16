package com.visera.backend.Entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    @Column(unique = true)
    @NotBlank(message = "Product code must not be blank")
    private String productCode;

    @NotBlank(message = "Category must not be blank")
    private String category;

    // Product lifecycle / catalog status (e.g. ACTIVE, INACTIVE, LOW_STOCK)
    private String status;

    private String imageUrl;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "Active";
        }
    }
}

