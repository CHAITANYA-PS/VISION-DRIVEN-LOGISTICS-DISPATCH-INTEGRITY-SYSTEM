package com.visera.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    @ManyToOne
    @JoinColumn(name = "reported_by")
    @NotNull(message = "Reporter must not be null")
    private User reportedBy;

    @NotNull(message = "Issue type must not be null")
    private String issueType; // MISMATCH, DAMAGED, LOCATION, OTHER

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Status must not be null")
    @Builder.Default
    private String status = "OPEN"; // OPEN, NOTED

    @ManyToOne
    @JoinColumn(name = "acknowledged_by")
    private User acknowledgedBy;

    private String expectedSku;
    private String detectedSku;
    private Double confidence;

    private LocalDateTime createdAt;
    private LocalDateTime acknowledgedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "OPEN";
        }
    }
}

