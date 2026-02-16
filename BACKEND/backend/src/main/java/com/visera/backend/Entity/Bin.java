package com.visera.backend.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

@Entity
@Table(name = "bins")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "rack_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Rack rack;

    private String name;      // Display name (e.g., "Bin A1")
    private String code;      // Unique identifier (e.g., "Z1-R2-B5")
    private Integer capacity; // Max quantity
}
