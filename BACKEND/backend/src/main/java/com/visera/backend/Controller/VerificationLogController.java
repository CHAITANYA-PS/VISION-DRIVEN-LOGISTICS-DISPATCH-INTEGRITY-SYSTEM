package com.visera.backend.Controller;

import com.visera.backend.DTOs.VerificationDTO;
import com.visera.backend.DTOs.VerificationSummaryDTO;
import com.visera.backend.Entity.VerificationLog;
import com.visera.backend.Service.VerificationLogService;
import com.visera.backend.mapper.EntityMapper;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/verification-logs")
@CrossOrigin(origins = "*")
public class VerificationLogController {

    @Autowired
    EntityMapper mapper;

    private final VerificationLogService verificationLogService;

    public VerificationLogController(VerificationLogService verificationLogService) {
        this.verificationLogService = verificationLogService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<VerificationLog> create(@RequestBody VerificationLog log) {
        return ResponseEntity.ok(verificationLogService.createLog(log));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/shipment/{shipmentItemId}")
    public ResponseEntity<List<VerificationLog>> getByShipmentItem(@PathVariable int shipmentItemId) {
        return ResponseEntity.ok(verificationLogService.getLogsByShipmentItem(shipmentItemId));
    }

    //DTO
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/shipment-item/{itemId}")
    public ResponseEntity<List<VerificationDTO>> getLogs(@PathVariable int itemId) {
        return ResponseEntity.ok(
                verificationLogService.getLogsByShipmentItem(itemId).stream()
                        .map(mapper::toVerificationDTO).collect(java.util.stream.Collectors.toList())

        );
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @GetMapping("/all")
    public ResponseEntity<List<VerificationDTO>> getAllVerificationLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String operation,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String status
    ) {
        List<VerificationLog> logs;
        
        if (search != null || operation != null || result != null || status != null) {
            logs = verificationLogService.getVerificationLogsWithFilters(search, operation, result, status);
        } else {
            logs = verificationLogService.getAllVerificationLogs();
        }
        
        return ResponseEntity.ok(
                logs.stream()
                        .map(mapper::toVerificationDTO)
                        .collect(java.util.stream.Collectors.toList())
        );
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @GetMapping("/summary")
    public ResponseEntity<VerificationSummaryDTO> getVerificationSummary() {
        return ResponseEntity.ok(verificationLogService.getVerificationSummary());
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/{id}")
    public ResponseEntity<VerificationDTO> updateVerificationLog(
            @PathVariable Long id,
            @RequestBody VerificationLog updatedLog
    ) {
        VerificationLog log = verificationLogService.updateVerificationLog(id, updatedLog);
        return ResponseEntity.ok(mapper.toVerificationDTO(log));
    }
    
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVerificationLog(@PathVariable Long id) {
        verificationLogService.deleteVerificationLog(id);
        return ResponseEntity.noContent().build();
    }

}
