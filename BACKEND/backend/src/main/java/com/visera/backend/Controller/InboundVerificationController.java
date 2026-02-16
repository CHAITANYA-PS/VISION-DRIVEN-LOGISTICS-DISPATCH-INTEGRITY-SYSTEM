package com.visera.backend.Controller;

import com.visera.backend.DTOs.ShipmentItemDTO;
import com.visera.backend.DTOs.VerificationResponse;
import com.visera.backend.Entity.Bin;
import com.visera.backend.Entity.InventoryStock;
import com.visera.backend.Entity.Rack;
import com.visera.backend.Entity.User;
import com.visera.backend.Entity.Zone;
import com.visera.backend.Repository.InventoryStockRepository;
import com.visera.backend.Repository.UserRepository;
import com.visera.backend.Service.InboundVerificationService;
import com.visera.backend.Service.ShipmentItemService;
import com.visera.backend.mapper.EntityMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inbound-verification")
@CrossOrigin(origins = "*")
public class InboundVerificationController {

    @Autowired
    private EntityMapper mapper;

    private final InboundVerificationService inboundVerificationService;
    private final ShipmentItemService shipmentItemService;
    private final InventoryStockRepository inventoryStockRepository;
    private final UserRepository userRepository;

    public InboundVerificationController(
        InboundVerificationService inboundVerificationService,
        ShipmentItemService shipmentItemService,
        InventoryStockRepository inventoryStockRepository,
        UserRepository userRepository
    ) {
        this.inboundVerificationService = inboundVerificationService;
        this.shipmentItemService = shipmentItemService;
        this.inventoryStockRepository = inventoryStockRepository;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasRole('WORKER')")
    @PostMapping("/verify/{shipmentItemId}")
    public ResponseEntity<VerificationResponse> verifyPackage(
        @PathVariable Long shipmentItemId,
        @RequestParam("image") MultipartFile image
    ) {
        try {
            // Get current user email from authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            // Find user by email and get ID
            User worker = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Worker not found with email: " + userEmail));
            Long workerId = worker.getId();

            VerificationResponse response = inboundVerificationService.verifyAndProcessInbound(
                shipmentItemId,
                image,
                workerId
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            VerificationResponse errorResponse = VerificationResponse.builder()
                .status("ERROR")
                .message("Verification failed: " + e.getMessage())
                .matched(false)
                .autoAssigned(false)
                .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PreAuthorize("hasAnyRole('WORKER', 'SUPERVISOR')")
    @GetMapping("/shipment-items/{shipmentId}")
    public ResponseEntity<List<ShipmentItemDTO>> getShipmentItemsWithLocations(
        @PathVariable Long shipmentId
    ) {
        try {
            List<ShipmentItemDTO> items = shipmentItemService.getItemsByShipment(shipmentId.intValue())
                .stream()
                .map(item -> {
                    ShipmentItemDTO dto = mapper.toShipmentItemDTO(item);
                    
                    // Add bin location details
                    InventoryStock stock = inventoryStockRepository
                        .findBySkuId(item.getSku().getId())
                        .stream()
                        .findFirst()
                        .orElse(null);
                    
                    if (stock != null && stock.getBin() != null) {
                        Bin bin = stock.getBin();
                        Rack rack = bin.getRack();
                        Zone zone = rack.getZone();
                        
                        dto.setZoneName(zone.getName());
                        dto.setRackName(rack.getName());
                        dto.setBinName(bin.getName());
                        dto.setBinCode(bin.getCode());
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

