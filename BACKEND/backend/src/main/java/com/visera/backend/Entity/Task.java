package com.visera.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @NotNull(message = "User must not be null")
    private User user;

    @ManyToOne
    @JoinColumn(name = "shipment_item_id")
    @NotNull(message = "ShipmentItem must not be null")
    private ShipmentItem shipmentItem;

    private String taskType; // PUTAWAY / PICKING
    private String status;   // PENDING / IN_PROGRESS / COMPLETED

    @ManyToOne
    @JoinColumn(name = "suggested_bin_id")
    private Bin suggestedBin; // Primary suggested bin for putaway (for UI display)

    private String suggestedLocation; // Formatted location string (e.g., "Zone A - Electronics / A3-B2-01")

    @ManyToOne
    @JoinColumn(name = "suggested_zone_id")
    private Zone suggestedZone; // Suggested zone ID

    private Boolean inProgress = false; // Track if worker started putaway

    @Column(columnDefinition = "TEXT")
    private String allocationPlan; // JSON string storing bin allocation plan for overflow cases

    private LocalDateTime createdAt;
    private LocalDateTime completedAt; // When task was completed

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
