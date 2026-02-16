package com.visera.backend.Controller;

import com.visera.backend.DTOs.ApprovalDTO;
import com.visera.backend.Entity.Approval;
import com.visera.backend.Entity.InventoryStock;
import com.visera.backend.Entity.User;
import com.visera.backend.Repository.InventoryStockRepository;
import com.visera.backend.Repository.UserRepository;
import com.visera.backend.Service.ApprovalService;
import com.visera.backend.Service.InventoryStockService;
import com.visera.backend.Service.ShipmentItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/approvals")
@CrossOrigin(origins = "*")
public class ApprovalController {

    private final ApprovalService approvalService;
    private final UserRepository userRepository;
    private final InventoryStockService inventoryStockService;
    private final ShipmentItemService shipmentItemService;
    private final InventoryStockRepository inventoryStockRepository;

    public ApprovalController(
        ApprovalService approvalService,
        UserRepository userRepository,
        InventoryStockService inventoryStockService,
        ShipmentItemService shipmentItemService,
        InventoryStockRepository inventoryStockRepository
    ) {
        this.approvalService = approvalService;
        this.userRepository = userRepository;
        this.inventoryStockService = inventoryStockService;
        this.shipmentItemService = shipmentItemService;
        this.inventoryStockRepository = inventoryStockRepository;
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @GetMapping("/pending")
    public ResponseEntity<List<ApprovalDTO>> getPendingApprovals() {
        try {
            List<Approval> approvals = approvalService.getPendingApprovals();
            
            List<ApprovalDTO> dtos = approvals.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<Approval> approveRequest(@PathVariable Long id) {
        try {
            // Get current user email from authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            // Find user by email
            User supervisor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Supervisor not found with email: " + userEmail));

            // Approve the request
            Approval approval = approvalService.approveRequest(id, supervisor);

            // Auto-assign to bin after approval
            try {
                InventoryStock existingStock = inventoryStockRepository
                    .findBySkuId(approval.getShipmentItem().getSku().getId())
                    .stream()
                    .findFirst()
                    .orElse(null);

                if (existingStock != null && existingStock.getBin() != null) {
                    int newQuantity = existingStock.getQuantity() + approval.getShipmentItem().getQuantity();
                    inventoryStockService.updateQuantityById(existingStock.getId(), newQuantity);
                    
                    // Update shipment item status
                    approval.getShipmentItem().setStatus("RECEIVED");
                    shipmentItemService.updateShipmentItem(
                        approval.getShipmentItem().getId().intValue(), 
                        approval.getShipmentItem()
                    );
                }
            } catch (Exception e) {
                // Log error but don't fail the approval
                System.err.println("Failed to auto-assign after approval: " + e.getMessage());
            }

            return ResponseEntity.ok(approval);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<Approval> rejectRequest(
        @PathVariable Long id,
        @RequestBody Map<String, String> body
    ) {
        try {
            // Get current user email from authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            // Find user by email
            User supervisor = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Supervisor not found with email: " + userEmail));

            String reason = body.get("reason");
            Approval approval = approvalService.rejectRequest(id, supervisor, reason);

            return ResponseEntity.ok(approval);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private ApprovalDTO convertToDTO(Approval approval) {
        ApprovalDTO dto = new ApprovalDTO();
        dto.setId(approval.getId());
        dto.setShipmentItemId(approval.getShipmentItem().getId());
        dto.setShipmentItemName("Item #" + approval.getShipmentItem().getId());
        dto.setRequestedById(approval.getRequestedBy().getId());
        dto.setRequestedByName(approval.getRequestedBy().getName());
        dto.setType(approval.getType());
        dto.setStatus(approval.getStatus());
        dto.setReason(approval.getReason());
        dto.setExtractedData(approval.getExtractedData());
        dto.setExpectedData(approval.getExpectedData());
        dto.setRequestedAt(approval.getRequestedAt());
        dto.setReviewedAt(approval.getReviewedAt());
        
        if (approval.getReviewedBy() != null) {
            dto.setReviewedById(approval.getReviewedBy().getId());
            dto.setReviewedByName(approval.getReviewedBy().getName());
        }
        
        return dto;
    }
}

