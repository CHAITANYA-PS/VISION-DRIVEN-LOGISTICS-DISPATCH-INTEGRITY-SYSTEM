package com.visera.backend.mapper;

import com.visera.backend.DTOs.*;
import com.visera.backend.Entity.*;
import com.visera.backend.Repository.ShipmentItemRepository;
import com.visera.backend.Repository.ShipmentWorkerRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class EntityMapper {

    @Autowired
    private ShipmentWorkerRepository shipmentWorkerRepository;

    @Autowired
    private ShipmentItemRepository shipmentItemRepository;
    
    @Autowired
    private com.visera.backend.Repository.ApprovalRepository approvalRepository;
    
    @Autowired
    private com.visera.backend.Repository.InventoryStockRepository inventoryStockRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ShipmentDTO toShipmentDTO(Shipment shipment) {
        ShipmentDTO dto = new ShipmentDTO();
        dto.setId(shipment.getId());
        dto.setShipmentType(shipment.getShipmentType());
        dto.setStatus(shipment.getStatus());
        dto.setCreatedBy(shipment.getCreatedBy());
        dto.setAssignedTo(shipment.getAssignedTo());
        dto.setDeadline(shipment.getDeadline());
        dto.setCreatedAt(shipment.getCreatedAt());

        // Assigned workers
        List<ShipmentWorker> shipmentWorkers = shipmentWorkerRepository.findByShipment(shipment);
        List<UserDTO> assignedWorkers = shipmentWorkers.stream()
                .map(sw -> {
                    UserDTO userDTO = new UserDTO();
                    userDTO.setId(sw.getWorker().getId());
                    userDTO.setName(sw.getWorker().getName());
                    userDTO.setEmail(sw.getWorker().getEmail());
                    userDTO.setRole(sw.getWorker().getRole());
                    return userDTO;
                })
                .collect(Collectors.toList());
        dto.setAssignedWorkers(assignedWorkers);

        // Package count
        int packageCount = shipmentItemRepository.findByShipmentId(shipment.getId()).size();
        dto.setPackageCount(packageCount);
        
        // Verified count (items with status VERIFIED, RECEIVED, or DISPATCHED)
        // For OUTBOUND: VERIFIED → RECEIVED → DISPATCHED (all count as verified)
        // For INBOUND: VERIFIED → RECEIVED (both count as verified)
        int verifiedCount = shipmentItemRepository.findByShipmentId(shipment.getId())
                .stream()
                .filter(item -> {
                    String status = item.getStatus();
                    return "VERIFIED".equals(status) 
                        || "RECEIVED".equals(status) 
                        || "DISPATCHED".equals(status);
                })
                .mapToInt(item -> 1)
                .sum();
        dto.setVerifiedCount(verifiedCount);
        
        return dto;
    }

    public ShipmentItemDTO toShipmentItemDTO(ShipmentItem item) {
        if (item == null) {
            return null;
        }
        
        ShipmentItemDTO dto = new ShipmentItemDTO();
        dto.setId(item.getId());
        
        if (item.getShipment() != null) {
            dto.setShipmentId(item.getShipment().getId());
        }
        
        if (item.getSku() != null) {
            dto.setSkuId(item.getSku().getId());
            dto.setSkuCode(item.getSku().getSkuCode());
            
            if (item.getSku().getProduct() != null) {
                dto.setProductName(item.getSku().getProduct().getName());
                dto.setProductCode(item.getSku().getProduct().getProductCode());
            }
        }
        
        dto.setQuantity(item.getQuantity());
        dto.setStatus(item.getStatus());
        return dto;
    }

    public TaskDTO toTaskDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setUserId(task.getUser().getId());
        dto.setShipmentItemId(task.getShipmentItem().getId());
        dto.setTaskType(task.getTaskType());
        dto.setStatus(task.getStatus());
        dto.setCreatedAt(task.getCreatedAt());
        return dto;
    }

    public NotificationDTO toNotificationDTO(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setUserId(n.getUser().getId());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType());
        dto.setRead(n.isRead());
        return dto;
    }

    public VerificationDTO toVerificationDTO(VerificationLog log) {
        VerificationDTO dto = new VerificationDTO();
        
        // Log identification
        dto.setId(log.getId());
        dto.setTimestamp(log.getVerifiedAt());
        
        // Employee information
        User employee = log.getVerifiedBy();
        if (employee != null) {
            dto.setEmployeeId(employee.getId());
            dto.setEmployeeName(employee.getName());
            dto.setEmployeeEmail(employee.getEmail());
        }
        
        // Shipment item and related entities
        ShipmentItem shipmentItem = log.getShipmentItem();
        dto.setShipmentItemId(shipmentItem.getId());
        
        // Operation type from shipment
        Shipment shipment = shipmentItem.getShipment();
        String operation = shipment.getShipmentType(); // INBOUND or OUTBOUND
        dto.setOperation(operation);
        
        // SKU information
        Sku sku = shipmentItem.getSku();
        if (sku != null) {
            dto.setSkuId(sku.getId());
            dto.setSkuCode(sku.getSkuCode());
            
            // Product information
            Product product = sku.getProduct();
            if (product != null) {
                dto.setProductId(product.getId());
                dto.setProductName(product.getName());
                dto.setProductCode(product.getProductCode());
            }
        }
        
        // Verification data
        dto.setExtractedSku(log.getExtractedSku());
        dto.setExpectedSku(log.getExpectedSku());
        dto.setExtractedProductCode(log.getExtractedProductCode());
        dto.setExpectedProductCode(log.getExpectedProductCode());
        dto.setExtractedWeight(log.getExtractedWeight());
        dto.setExpectedWeight(log.getExpectedWeight());
        dto.setExtractedColor(log.getExtractedColor());
        dto.setExpectedColor(log.getExpectedColor());
        dto.setExtractedDimensions(log.getExtractedDimensions());
        dto.setExpectedDimensions(log.getExpectedDimensions());
        
        // AI results
        dto.setAiConfidence(log.getAiConfidence());
        dto.setResult(log.getResult());
        
        // Determine status from approval
        List<Approval> approvals = approvalRepository.findByShipmentItemId(shipmentItem.getId());
        if (approvals != null && !approvals.isEmpty()) {
            Approval approval = approvals.get(0); // Get the most recent approval
            dto.setApprovalId(approval.getId());
            
            String approvalStatus = approval.getStatus();
            if ("PENDING".equals(approvalStatus)) {
                dto.setStatus("PENDING");
            } else if ("APPROVED".equals(approvalStatus)) {
                dto.setStatus("SUPERVISOR_APPROVED");
            } else if ("REJECTED".equals(approvalStatus)) {
                dto.setStatus("REJECTED");
            }
        } else {
            // No approval exists
            if ("MATCH".equals(log.getResult())) {
                dto.setStatus("AUTO_APPROVED");
            } else {
                dto.setStatus("PENDING");
            }
        }
        
        return dto;
    }

    public SkuDTO toSkuDTO(Sku sku) {
        SkuDTO dto = new SkuDTO();
        dto.setId(sku.getId());
        dto.setSkuCode(sku.getSkuCode());
        dto.setColor(sku.getColor());
        dto.setDimensions(sku.getDimensions());
        dto.setWeight(sku.getWeight());
        dto.setProductId(sku.getProduct().getId());
        return dto;
    }

    public PutawayItemDTO toPutawayItemDTO(Task task) {
        PutawayItemDTO dto = new PutawayItemDTO();
        dto.setId(task.getId());
        
        ShipmentItem shipmentItem = task.getShipmentItem();
        dto.setShipmentItemId(shipmentItem.getId());
        
        Sku sku = shipmentItem.getSku();
        dto.setSkuCode(sku.getSkuCode());
        dto.setQuantity(shipmentItem.getQuantity());
        
        Product product = sku.getProduct();
        dto.setProductName(product.getName());
        dto.setCategory(product.getCategory());
        
        // Status: PENDING or IN_PROGRESS
        String status = task.getInProgress() != null && task.getInProgress() ? "IN_PROGRESS" : "PENDING";
        dto.setStatus(status);
        
        // Suggested location details
        if (task.getSuggestedBin() != null) {
            Bin bin = task.getSuggestedBin();
            dto.setSuggestedBinId(bin.getId());
            // Use bin code if available, otherwise fall back to bin name (consistent with formatBinLocation)
            dto.setSuggestedBinCode(bin.getCode() != null ? bin.getCode() : bin.getName());
            
            if (bin.getRack() != null) {
                Rack rack = bin.getRack();
                dto.setSuggestedRackName(rack.getName());
                
                if (rack.getZone() != null) {
                    Zone zone = rack.getZone();
                    dto.setSuggestedZoneId(zone.getId());
                    dto.setSuggestedZoneName(zone.getName());
                }
            }
        }
        
        dto.setSuggestedLocation(task.getSuggestedLocation());
        
        // Parse allocation plan if exists
        List<BinAllocation> allocationPlan = new ArrayList<>();
        boolean hasOverflow = false;
        int availableCapacity = 0;
        
        if (task.getAllocationPlan() != null && !task.getAllocationPlan().isEmpty()) {
            try {
                List<Map<String, Object>> allocations = objectMapper.readValue(
                    task.getAllocationPlan(),
                    new TypeReference<List<Map<String, Object>>>() {}
                );
                
                if (allocations.size() > 1) {
                    hasOverflow = true;
                }
                
                for (Map<String, Object> alloc : allocations) {
                    // Use binCode if available, otherwise fall back to binName (for backward compatibility)
                    String binCode = alloc.get("binCode") != null ? alloc.get("binCode").toString() : null;
                    if (binCode == null && alloc.get("binName") != null) {
                        binCode = alloc.get("binName").toString();
                    }
                    BinAllocation binAlloc = BinAllocation.builder()
                        .binId(Long.valueOf(alloc.get("binId").toString()))
                        .binCode(binCode)
                        .quantity(Integer.valueOf(alloc.get("quantity").toString()))
                        .build();
                    allocationPlan.add(binAlloc);
                    
                    // Get available capacity for primary bin
                    if (allocations.indexOf(alloc) == 0 && task.getSuggestedBin() != null) {
                        Bin primaryBin = task.getSuggestedBin();
                        if (primaryBin.getCapacity() != null) {
                            // Calculate available capacity (would need to check current stock)
                            availableCapacity = primaryBin.getCapacity();
                        }
                    }
                }
            } catch (Exception e) {
                // If parsing fails, just continue without allocation plan
            }
        }
        
        dto.setAllocationPlan(allocationPlan);
        dto.setHasOverflow(hasOverflow);
        dto.setAvailableCapacity(availableCapacity);
        
        return dto;
    }

    public PickingItemDTO toPickingItemDTO(Task task, Long currentUserId) {
        PickingItemDTO dto = new PickingItemDTO();
        dto.setId(task.getId());
        
        ShipmentItem shipmentItem = task.getShipmentItem();
        dto.setShipmentItemId(shipmentItem.getId());
        
        Sku sku = shipmentItem.getSku();
        dto.setSkuCode(sku.getSkuCode());
        dto.setQuantity(shipmentItem.getQuantity());
        
        Product product = sku.getProduct();
        dto.setProductName(product.getName());
        dto.setCategory(product.getCategory());
        
        // Task status
        String status = task.getInProgress() != null && task.getInProgress() ? "IN_PROGRESS" : task.getStatus();
        dto.setStatus(status);
        
        // Suggested location details
        if (task.getSuggestedBin() != null) {
            Bin bin = task.getSuggestedBin();
            dto.setSuggestedBinId(bin.getId());
            // Use bin code if available, otherwise fall back to bin name (consistent with formatBinLocation)
            dto.setSuggestedBinCode(bin.getCode() != null ? bin.getCode() : bin.getName());
            
            if (bin.getRack() != null) {
                Rack rack = bin.getRack();
                dto.setSuggestedRackName(rack.getName());
                
                if (rack.getZone() != null) {
                    Zone zone = rack.getZone();
                    dto.setSuggestedZoneId(zone.getId());
                    dto.setSuggestedZoneName(zone.getName());
                }
            }
        }
        
        dto.setSuggestedLocation(task.getSuggestedLocation());
        
        // Shipment information
        Shipment shipment = shipmentItem.getShipment();
        dto.setShipmentId(shipment.getId());
        dto.setShipmentDeadline(shipment.getDeadline());
        // Note: orderNumber and destination are not in Shipment entity, set to null for now
        dto.setOrderNumber(null);
        dto.setDestination(null);
        
        // Assignment information
        if (task.getUser() != null) {
            dto.setAssignedToUserId(task.getUser().getId());
            dto.setAssignedToUserName(task.getUser().getName());
            dto.setIsAssignedToMe(currentUserId != null && task.getUser().getId().equals(currentUserId));
        } else {
            dto.setIsAssignedToMe(false);
        }
        
        // Stock information - check available stock in suggested bin
        if (task.getSuggestedBin() != null && sku != null) {
            inventoryStockRepository.findBySkuIdAndBinId(sku.getId(), task.getSuggestedBin().getId())
                .ifPresentOrElse(
                    stock -> {
                        dto.setAvailableStock(stock.getQuantity());
                        dto.setHasInsufficientStock(stock.getQuantity() < shipmentItem.getQuantity());
                    },
                    () -> {
                        dto.setAvailableStock(0);
                        dto.setHasInsufficientStock(true);
                    }
                );
        } else {
            dto.setAvailableStock(0);
            dto.setHasInsufficientStock(true);
        }
        
        return dto;
    }

    public RecentCompletionDTO toRecentCompletionDTO(Task task) {
        RecentCompletionDTO dto = new RecentCompletionDTO();
        dto.setTaskId(task.getId());
        
        ShipmentItem shipmentItem = task.getShipmentItem();
        Sku sku = shipmentItem.getSku();
        dto.setSkuCode(sku.getSkuCode());
        dto.setProductName(sku.getProduct().getName());
        
        // Get location from suggested location or bin code
        if (task.getSuggestedBin() != null && task.getSuggestedBin().getCode() != null) {
            dto.setLocation(task.getSuggestedBin().getCode());
        } else if (task.getSuggestedLocation() != null) {
            // Extract bin code from location string if possible
            dto.setLocation(task.getSuggestedLocation());
        } else {
            dto.setLocation("N/A");
        }
        
        // Use completedAt if available, otherwise use createdAt
        dto.setCompletedAt(task.getCompletedAt() != null ? task.getCompletedAt() : task.getCreatedAt());
        
        return dto;
    }

    public IssueDTO toIssueDTO(Issue issue) {
        IssueDTO dto = new IssueDTO();
        
        // Basic information
        dto.setId(issue.getId());
        dto.setIssueType(issue.getIssueType());
        dto.setDescription(issue.getDescription());
        dto.setStatus(issue.getStatus());
        dto.setCreatedAt(issue.getCreatedAt());
        
        // Shipment information
        if (issue.getShipment() != null) {
            dto.setShipmentId(issue.getShipment().getId());
        }
        
        // Reporter information
        User reportedBy = issue.getReportedBy();
        if (reportedBy != null) {
            dto.setReportedById(reportedBy.getId());
            dto.setReportedByName(reportedBy.getName());
            dto.setReportedByEmail(reportedBy.getEmail());
        }
        
        // Acknowledgment information
        User acknowledgedBy = issue.getAcknowledgedBy();
        if (acknowledgedBy != null) {
            dto.setAcknowledgedById(acknowledgedBy.getId());
            dto.setAcknowledgedByName(acknowledgedBy.getName());
        }
        dto.setAcknowledgedAt(issue.getAcknowledgedAt());
        
        // SKU mismatch details
        dto.setExpectedSku(issue.getExpectedSku());
        dto.setDetectedSku(issue.getDetectedSku());
        dto.setConfidence(issue.getConfidence());
        
        return dto;
    }
}

