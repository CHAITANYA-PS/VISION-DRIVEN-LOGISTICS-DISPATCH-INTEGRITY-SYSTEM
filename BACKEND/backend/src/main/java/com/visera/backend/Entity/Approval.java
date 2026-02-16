package com.visera.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Approval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "shipment_item_id")
    @NotNull(message = "Shipment item must not be null")
    private ShipmentItem shipmentItem;

    @ManyToOne
    @JoinColumn(name = "requested_by")
    @NotNull(message = "Requester must not be null")
    private User requestedBy;

    @NotNull(message = "Type must not be null")
    private String type; // VERIFICATION_MISMATCH, MANUAL_OVERRIDE

    @NotNull(message = "Status must not be null")
    private String status; // PENDING, APPROVED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String extractedData; // JSON string of OCR results

    @Column(columnDefinition = "TEXT")
    private String expectedData; // JSON string of expected values

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        this.requestedAt = LocalDateTime.now();
    }
}






