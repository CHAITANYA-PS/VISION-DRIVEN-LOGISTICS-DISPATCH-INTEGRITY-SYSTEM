package com.visera.backend.Entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "verification_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "shipment_item_id")
    private ShipmentItem shipmentItem;

    private String uploadedImageUrl;
    private String extractedSku;
    private String expectedSku;
    private String extractedProductCode;
    private String expectedProductCode;
    private String extractedWeight;
    private String expectedWeight;
    private String extractedColor;
    private String expectedColor;
    private String extractedDimensions;
    private String expectedDimensions;
    private Double aiConfidence;
    private String result; // MATCH / MISMATCH / LOW_CONFIDENCE

    @ManyToOne
    @JoinColumn(name = "verified_by")
    @NotNull(message = "Verifier must not be null")
    private User verifiedBy;

    private LocalDateTime verifiedAt;

    @PrePersist
    protected void onCreate() {
        this.verifiedAt = LocalDateTime.now();
    }
}

