package com.visera.backend.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.visera.backend.DTOs.BinCreateDTO;
import com.visera.backend.DTOs.BinUpdateDTO;
import com.visera.backend.DTOs.BinWithStatusDTO;
import com.visera.backend.Entity.Bin;
import com.visera.backend.Service.BinService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bins")
@CrossOrigin(origins = "*")
public class BinController {

    private final BinService binService;

    public BinController(BinService binService) {
        this.binService = binService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<Bin> create(@Valid @RequestBody BinCreateDTO binCreateDTO) {
        return ResponseEntity.ok(binService.createBin(binCreateDTO));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/rack/{rackId}")
    public ResponseEntity<List<Bin>> getByRack(@PathVariable int rackId) {
        return ResponseEntity.ok(binService.getBinsByRack(rackId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/rack/{rackId}/with-status")
    public ResponseEntity<List<BinWithStatusDTO>> getByRackWithStatus(@PathVariable int rackId) {
        return ResponseEntity.ok(binService.getBinsWithStatusByRack(rackId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/update/{binId}")
    public ResponseEntity<Bin> updateBin(@PathVariable Long binId, @Valid @RequestBody BinUpdateDTO binUpdateDTO) {
        Bin updated = binService.updateBin(binId, binUpdateDTO);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @DeleteMapping("/delete/{binId}")
    public ResponseEntity<Void> deleteBin(@PathVariable Long binId) {
        binService.deleteBin(binId);
        return ResponseEntity.noContent().build();
    }
}

