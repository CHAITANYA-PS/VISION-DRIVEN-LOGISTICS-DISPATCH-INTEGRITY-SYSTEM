package com.visera.backend.Controller;

import com.visera.backend.DTOs.RackCreateDTO;
import com.visera.backend.DTOs.RackUpdateDTO;
import com.visera.backend.DTOs.RackWithBinsDTO;
import com.visera.backend.Entity.Rack;
import com.visera.backend.Service.RackService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/racks")
@CrossOrigin(origins = "*")
public class RackController {

    private final RackService rackService;

    public RackController(RackService rackService) {
        this.rackService = rackService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<Rack> create(@Valid @RequestBody RackCreateDTO rackCreateDTO) {
        return ResponseEntity.ok(rackService.createRack(rackCreateDTO));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/zone/{zoneId}")
    public ResponseEntity<List<Rack>> getByZone(@PathVariable Long zoneId) {
        return ResponseEntity.ok(rackService.getRacksByZone(zoneId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/zone/{zoneId}/with-bins")
    public ResponseEntity<List<RackWithBinsDTO>> getRacksWithBinsByZone(@PathVariable Long zoneId) {
        return ResponseEntity.ok(rackService.getRacksWithBinsByZone(zoneId));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/update/{rackId}")
    public ResponseEntity<Rack> updateRack(@PathVariable Long rackId, @Valid @RequestBody RackUpdateDTO rackUpdateDTO) {
        Rack updated = rackService.updateRack(rackId, rackUpdateDTO);
        return ResponseEntity.ok(updated);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @DeleteMapping("/delete/{rackId}")
    public ResponseEntity<Void> deleteRack(@PathVariable Long rackId) {
        rackService.deleteRack(rackId);
        return ResponseEntity.noContent().build();
    }
}
