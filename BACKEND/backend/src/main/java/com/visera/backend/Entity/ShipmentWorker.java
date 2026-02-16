package com.visera.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipment_workers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentWorker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    @NotNull(message = "Shipment must not be null")
    private Shipment shipment;

    @ManyToOne
    @JoinColumn(name = "worker_id")
    @NotNull(message = "Worker must not be null")
    private User worker;

    private LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        this.assignedAt = LocalDateTime.now();
    }
}

