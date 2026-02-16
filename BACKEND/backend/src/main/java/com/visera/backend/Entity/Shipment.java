package com.visera.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "shipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Shipment type must not be blank")
    private String shipmentType; // INBOUND / OUTBOUND
    @NotBlank(message = "Status must not be blank")
    private String status;       // CREATED, ARRIVED, PUTAWAY...

    @ManyToOne
    @JoinColumn(name = "created_by")
    @NotNull(message = "CreatedBy must not be null")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @NotNull(message = "Deadline must not be null")
    private LocalDate deadline;

    private LocalDateTime createdAt;

    // Bi-directional relationship to enable cascade delete
    @OneToMany(mappedBy = "shipment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShipmentWorker> shipmentWorkers;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
