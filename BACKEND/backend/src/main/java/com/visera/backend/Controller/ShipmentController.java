package com.visera.backend.Controller;

import com.visera.backend.DTOs.ShipmentDTO;
import com.visera.backend.DTOs.UserDTO;
import com.visera.backend.Entity.Shipment;
import com.visera.backend.Entity.User;
import com.visera.backend.Repository.UserRepository;
import com.visera.backend.Service.ShipmentService;
import com.visera.backend.Service.ShipmentWorkerService;
import com.visera.backend.mapper.EntityMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shipments")
@CrossOrigin(origins = "*")
public class ShipmentController {

    @Autowired
    EntityMapper mapper;
    private final ShipmentService shipmentService;
    private final ShipmentWorkerService shipmentWorkerService;
    private final UserRepository userRepository;

    public ShipmentController(ShipmentService shipmentService, ShipmentWorkerService shipmentWorkerService, UserRepository userRepository) {
        this.shipmentService = shipmentService;
        this.shipmentWorkerService = shipmentWorkerService;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<Shipment> create(@RequestBody Shipment shipment) {
        return ResponseEntity.ok(shipmentService.createShipment(shipment));
    }

//    //getter mapper
//    @GetMapping("getter-mapper")
//    public ResponseEntity<List<Shipment>> getAll() {
//        return ResponseEntity.ok(shipmentService.getAllShipments());
//    }
//
//    @GetMapping("/getbyid/{id}")
//    public ResponseEntity<Shipment> getById(@PathVariable int id) {
//        Shipment s = shipmentService.getShipmentById(id);
//        return (s != null) ? ResponseEntity.ok(s) : ResponseEntity.notFound().build();
//    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/{id}")
    public ResponseEntity<Shipment> update(@PathVariable int id, @RequestBody Shipment updated) {
        Shipment s = shipmentService.updateShipment(id, updated);
        return (s != null) ? ResponseEntity.ok(s) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        shipmentService.deleteShipment(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping
    public ResponseEntity<List<ShipmentDTO>> getAllShipments() {
        return ResponseEntity.ok(
                shipmentService.getAllShipments().stream()
                        .map(mapper::toShipmentDTO).toList()
        );
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/{id}")
    public ResponseEntity<ShipmentDTO> getById(@PathVariable int id) {
        Shipment s = shipmentService.getShipmentById(id);

        return (s != null)
                ? ResponseEntity.ok(mapper.toShipmentDTO(s))
                : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/{id}/assign-workers")
    public ResponseEntity<Void> assignWorkers(@PathVariable int id, @RequestBody List<Integer> workerIds) {
        shipmentWorkerService.assignWorkers(id, workerIds);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @DeleteMapping("/{id}/workers/{workerId}")
    public ResponseEntity<?> removeWorker(@PathVariable int id, @PathVariable int workerId) {
        try {
            shipmentWorkerService.removeWorker(id, workerId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/{id}/workers")
    public ResponseEntity<List<UserDTO>> getAssignedWorkers(@PathVariable int id) {
        return ResponseEntity.ok(shipmentWorkerService.getAssignedWorkers(id));
    }

    @PreAuthorize("hasRole('WORKER')")
    @GetMapping("/worker/assigned")
    public ResponseEntity<List<ShipmentDTO>> getAssignedShipments() {
        try {
            // Get current user from authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User worker = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Worker not found with email: " + userEmail));
            
            // Get all shipments assigned to this worker
            List<Shipment> shipments = shipmentService.getShipmentsByAssignedWorker(worker.getId());
            
            // Convert to DTOs
            List<ShipmentDTO> dtos = shipments.stream()
                    .map(mapper::toShipmentDTO)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new java.util.ArrayList<>());
        }
    }

}
