package com.visera.backend.Controller;

import com.visera.backend.Entity.Zone;
import com.visera.backend.Service.ZoneService;
import com.visera.backend.DTOs.ZoneStatisticsDTO;
import com.visera.backend.DTOs.ZoneUpdateDTO;
import com.visera.backend.DTOs.ZoneProductAllocationDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@CrossOrigin(origins = "*")
public class ZoneController {

    private final ZoneService zoneService;

    public ZoneController(ZoneService zoneService) {
        this.zoneService = zoneService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<Zone> create(@RequestBody Zone zone) {
        return ResponseEntity.ok(zoneService.createZone(zone));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/all")
    public ResponseEntity<List<Zone>> getAll() {
        return ResponseEntity.ok(zoneService.getAllZones());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/statistics")
    public ResponseEntity<List<ZoneStatisticsDTO>> getZoneStatistics() {
        return ResponseEntity.ok(zoneService.getAllZoneStatistics());
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/{zoneId}")
    public ResponseEntity<Zone> getById(@PathVariable Long zoneId) {
        Zone zone = zoneService.getZoneById(zoneId);
        return (zone != null) ? ResponseEntity.ok(zone) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/update/{zoneId}")
    public ResponseEntity<Zone> updateZone(@PathVariable Long zoneId, @RequestBody ZoneUpdateDTO zoneUpdateDTO) {
        Zone updated = zoneService.updateZone(zoneId, zoneUpdateDTO);
        return (updated != null) ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{zoneId}")
    public ResponseEntity<Void> deleteZone(@PathVariable Long zoneId) {
        zoneService.deleteZone(zoneId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/{zoneId}/product-allocation")
    public ResponseEntity<List<ZoneProductAllocationDTO>> getProductAllocationByZone(@PathVariable Long zoneId) {
        return ResponseEntity.ok(zoneService.getProductAllocationByZone(zoneId));
    }
}

