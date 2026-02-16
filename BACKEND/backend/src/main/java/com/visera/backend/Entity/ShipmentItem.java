package com.visera.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shipment_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    @NotNull(message = "Shipment must not be null")
    private Shipment shipment;

    @ManyToOne
    @JoinColumn(name = "sku_id")
    @NotNull(message = "SKU must not be null")
    private Sku sku;

    @NotNull(message = "Quantity must not be null")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private String status; // RECEIVED, STORED, PICKED, PACKED

    @OneToMany(mappedBy = "shipmentItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "shipmentItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<Approval> approvals = new ArrayList<>();

    @OneToMany(mappedBy = "shipmentItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<VerificationLog> verificationLogs = new ArrayList<>();
}

