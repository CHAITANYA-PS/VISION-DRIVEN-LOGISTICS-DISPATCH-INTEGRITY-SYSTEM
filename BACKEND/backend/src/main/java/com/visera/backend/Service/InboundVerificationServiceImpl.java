package com.visera.backend.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.visera.backend.DTOs.BinAllocation;
import com.visera.backend.DTOs.LocationAllocationResult;
import com.visera.backend.DTOs.OCRVerificationResult;
import com.visera.backend.DTOs.VerificationResponse;
import com.visera.backend.Entity.*;
import com.visera.backend.Repository.InventoryStockRepository;
import com.visera.backend.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InboundVerificationServiceImpl implements InboundVerificationService {

    private final OCRService ocrService;
    private final VerificationLogService verificationLogService;
    private final ApprovalService approvalService;
    private final InventoryStockService inventoryStockService;
    private final ShipmentItemService shipmentItemService;
    private final UserRepository userRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final LocationAllocationService locationAllocationService;
    private final TaskService taskService;
    private final ObjectMapper objectMapper;

    public InboundVerificationServiceImpl(
        OCRService ocrService,
        VerificationLogService verificationLogService,
        ApprovalService approvalService,
        InventoryStockService inventoryStockService,
        ShipmentItemService shipmentItemService,
        UserRepository userRepository,
        InventoryStockRepository inventoryStockRepository,
        LocationAllocationService locationAllocationService,
        TaskService taskService
    ) {
        this.ocrService = ocrService;
        this.verificationLogService = verificationLogService;
        this.approvalService = approvalService;
        this.inventoryStockService = inventoryStockService;
        this.shipmentItemService = shipmentItemService;
        this.userRepository = userRepository;
        this.inventoryStockRepository = inventoryStockRepository;
        this.locationAllocationService = locationAllocationService;
        this.taskService = taskService;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    @Transactional
    public VerificationResponse verifyAndProcessInbound(
        Long shipmentItemId,
        MultipartFile image,
        Long workerId
    ) {
        try {
            // 1. Get shipment item with SKU details
            ShipmentItem shipmentItem = shipmentItemService.getShipmentItemById(shipmentItemId.intValue());
            if (shipmentItem == null) {
                return buildErrorResponse("Shipment item not found");
            }

            Sku sku = shipmentItem.getSku();
            if (sku == null) {
                return buildErrorResponse("SKU not found for shipment item");
            }

            Product product = sku.getProduct();
            if (product == null) {
                return buildErrorResponse("Product not found for SKU");
            }

            User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

            // 2. Call OCR service with expected values
            OCRVerificationResult ocrResult = ocrService.verifyPackageLabel(
                image,
                product.getProductCode(),
                sku.getSkuCode(),
                sku.getWeight(),
                sku.getColor(),
                sku.getDimensions()
            );

            // 3. Create verification log
            VerificationLog log = createVerificationLog(shipmentItem, worker, ocrResult, sku, product);
            verificationLogService.createLog(log);

            // 4. Check verification result
            boolean matched = "MATCH".equals(ocrResult.getVerificationResult());

            if (matched) {
                // Create PUTAWAY task instead of auto-assigning
                return handleMatchedVerification(shipmentItem, sku, ocrResult, worker);
            } else {
                // Create approval request
                return handleMismatchedVerification(shipmentItem, worker, ocrResult, sku, product);
            }

        } catch (Exception e) {
            return buildErrorResponse("Verification failed: " + e.getMessage());
        }
    }

    private VerificationLog createVerificationLog(
        ShipmentItem shipmentItem,
        User worker,
        OCRVerificationResult ocrResult,
        Sku sku,
        Product product
    ) {
        OCRVerificationResult.ExtractedData data = ocrResult.getData();
        
        // Ensure result is never null - default to MISMATCH if OCR result is null or empty
        String result = ocrResult.getVerificationResult();
        if (result == null || result.isEmpty()) {
            result = "MISMATCH"; // Treat null/empty as mismatch for reporting purposes
        }
        
        return VerificationLog.builder()
            .shipmentItem(shipmentItem)
            .verifiedBy(worker)
            .extractedSku(data != null ? data.getSku() : null)
            .expectedSku(sku.getSkuCode())
            .extractedProductCode(data != null ? data.getProductCode() : null)
            .expectedProductCode(product.getProductCode())
            .extractedWeight(data != null ? data.getWeight() : null)
            .expectedWeight(sku.getWeight())
            .extractedColor(data != null ? data.getColor() : null)
            .expectedColor(sku.getColor())
            .extractedDimensions(data != null ? data.getDimensions() : null)
            .expectedDimensions(sku.getDimensions())
            .aiConfidence(data != null ? data.getConfidenceScore() : null)
            .result(result)
            .build();
    }

    private VerificationResponse handleMatchedVerification(
        ShipmentItem shipmentItem,
        Sku sku,
        OCRVerificationResult ocrResult,
        User worker
    ) {
        try {
            Shipment shipment = shipmentItem.getShipment();
            if (shipment == null) {
                return buildErrorResponse("Shipment not found for shipment item");
            }

            // Handle OUTBOUND shipments - create PICKING task
            if ("OUTBOUND".equals(shipment.getShipmentType())) {
                return handleOutboundMatchedVerification(shipmentItem, sku, ocrResult, worker);
            }
            
            // Handle INBOUND shipments - create PUTAWAY task
            if ("INBOUND".equals(shipment.getShipmentType())) {
                return handleInboundMatchedVerification(shipmentItem, sku, ocrResult, worker);
            }

            return buildErrorResponse("Unknown shipment type: " + shipment.getShipmentType());

        } catch (Exception e) {
            return buildErrorResponse("Failed to create task: " + e.getMessage());
        }
    }

    private VerificationResponse handleInboundMatchedVerification(
        ShipmentItem shipmentItem,
        Sku sku,
        OCRVerificationResult ocrResult,
        User worker
    ) {
        try {
            // Use LocationAllocationService to get allocation plan
            LocationAllocationResult allocationResult = locationAllocationService
                .allocateLocationWithOverflow(sku, shipmentItem.getQuantity());

            // Check for errors in allocation result
            if (allocationResult == null || 
                (allocationResult.getHasError() != null && allocationResult.getHasError()) ||
                allocationResult.getPrimaryBin() == null) {
                
                String errorMessage = allocationResult != null && allocationResult.getErrorMessage() != null
                    ? allocationResult.getErrorMessage()
                    : "Verification matched but no suitable bin location found for SKU. Manual assignment required.";
                
                // If zone capacity is full, create approval request for supervisor intervention
                if (allocationResult != null && 
                    allocationResult.getZoneCapacityFull() != null && 
                    allocationResult.getZoneCapacityFull()) {
                    return buildMismatchResponse(
                        errorMessage,
                        ocrResult,
                        sku,
                        null
                    );
                }
                
                return buildMismatchResponse(
                    errorMessage,
                    ocrResult,
                    sku,
                    null
                );
            }

            // Convert allocation plan to JSON
            String allocationPlanJson = null;
            if (allocationResult.getBinAllocations() != null && !allocationResult.getBinAllocations().isEmpty()) {
                List<Map<String, Object>> allocations = allocationResult.getBinAllocations().stream()
                    .map(ba -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("binId", ba.getBinId());
                        map.put("binCode", ba.getBinCode());
                        map.put("binName", ba.getBinName()); // Store binName as fallback
                        map.put("quantity", ba.getQuantity());
                        return map;
                    })
                    .collect(Collectors.toList());
                allocationPlanJson = objectMapper.writeValueAsString(allocations);
            }

            // Create PUTAWAY task
            Task putawayTask = Task.builder()
                .user(worker)
                .shipmentItem(shipmentItem)
                .taskType("PUTAWAY")
                .status("PENDING")
                .suggestedBin(allocationResult.getPrimaryBin())
                .suggestedLocation(allocationResult.getSuggestedLocation())
                .suggestedZone(allocationResult.getPrimaryBin().getRack() != null 
                    ? allocationResult.getPrimaryBin().getRack().getZone() 
                    : null)
                .inProgress(false)
                .allocationPlan(allocationPlanJson)
                .build();

            taskService.createTask(putawayTask);

            // Update shipment item status to VERIFIED (not RECEIVED yet)
            shipmentItem.setStatus("VERIFIED");
            shipmentItemService.updateShipmentItem(shipmentItem.getId().intValue(), shipmentItem);

            return buildSuccessResponse(ocrResult, sku, allocationResult.getSuggestedLocation());

        } catch (Exception e) {
            return buildErrorResponse("Failed to create putaway task: " + e.getMessage());
        }
    }

    private VerificationResponse handleOutboundMatchedVerification(
        ShipmentItem shipmentItem,
        Sku sku,
        OCRVerificationResult ocrResult,
        User worker
    ) {
        try {
            // Find existing inventory stock for this SKU to suggest pick locations
            List<InventoryStock> stockList = inventoryStockRepository.findBySkuId(sku.getId());
            
            if (stockList == null || stockList.isEmpty()) {
                return buildMismatchResponse(
                    "Verification matched but no inventory stock found for SKU. Cannot create picking task.",
                    ocrResult,
                    sku,
                    null
                );
            }

            // Find stock with sufficient quantity (prioritize bins with enough stock)
            InventoryStock suggestedStock = stockList.stream()
                .filter(stock -> stock.getQuantity() >= shipmentItem.getQuantity())
                .findFirst()
                .orElse(stockList.get(0)); // If no bin has enough, use first available (partial pick)

            Bin suggestedBin = suggestedStock.getBin();
            if (suggestedBin == null) {
                return buildMismatchResponse(
                    "Inventory stock found but bin location is missing. Manual assignment required.",
                    ocrResult,
                    sku,
                    null
                );
            }

            // Format location string
            String suggestedLocation = formatBinLocation(suggestedBin);
            
            // Get zone from bin's rack
            Zone suggestedZone = null;
            if (suggestedBin.getRack() != null && suggestedBin.getRack().getZone() != null) {
                suggestedZone = suggestedBin.getRack().getZone();
            }

            // Create PICKING task - assigned to the worker who verified
            Task pickingTask = Task.builder()
                .user(worker) // Assign to verifying worker
                .shipmentItem(shipmentItem)
                .taskType("PICKING")
                .status("PENDING")
                .suggestedBin(suggestedBin)
                .suggestedLocation(suggestedLocation)
                .suggestedZone(suggestedZone)
                .inProgress(false)
                .build();

            taskService.createTask(pickingTask);

            // Update shipment item status to VERIFIED
            shipmentItem.setStatus("VERIFIED");
            shipmentItemService.updateShipmentItem(shipmentItem.getId().intValue(), shipmentItem);

            return buildSuccessResponse(ocrResult, sku, suggestedLocation);

        } catch (Exception e) {
            return buildErrorResponse("Failed to create picking task: " + e.getMessage());
        }
    }

    private VerificationResponse handleMismatchedVerification(
        ShipmentItem shipmentItem,
        User worker,
        OCRVerificationResult ocrResult,
        Sku sku,
        Product product
    ) {
        try {
            // Create expected data JSON
            Map<String, String> expectedData = new HashMap<>();
            expectedData.put("productCode", product.getProductCode());
            expectedData.put("skuCode", sku.getSkuCode());
            expectedData.put("weight", sku.getWeight());
            expectedData.put("color", sku.getColor());
            expectedData.put("dimensions", sku.getDimensions());
            
            String expectedDataJson = objectMapper.writeValueAsString(expectedData);

            // Create approval request
            Approval approval = approvalService.createApprovalRequest(
                shipmentItem,
                worker,
                ocrResult,
                expectedDataJson
            );

            return buildMismatchResponse(
                "Verification mismatch detected. Approval request submitted.",
                ocrResult,
                sku,
                approval.getId()
            );

        } catch (Exception e) {
            return buildErrorResponse("Failed to create approval request: " + e.getMessage());
        }
    }

    private String formatBinLocation(Bin bin) {
        Rack rack = bin.getRack();
        Zone zone = rack.getZone();
        return String.format("%s / %s / %s (%s)", 
            zone.getName(), 
            rack.getName(), 
            bin.getName(),
            bin.getCode() != null ? bin.getCode() : "");
    }

    private VerificationResponse buildSuccessResponse(
        OCRVerificationResult ocrResult,
        Sku sku,
        String binLocation
    ) {
        OCRVerificationResult.ExtractedData data = ocrResult.getData();
        
        return VerificationResponse.builder()
            .status("SUCCESS")
            .message("Verification successful. Package assigned to bin location.")
            .matched(true)
            .autoAssigned(true)
            .details(VerificationResponse.VerificationDetails.builder()
                .extractedProductCode(data.getProductCode())
                .expectedProductCode(sku.getProduct().getProductCode())
                .extractedSku(data.getSku())
                .expectedSku(sku.getSkuCode())
                .extractedWeight(data.getWeight())
                .expectedWeight(sku.getWeight())
                .extractedColor(data.getColor())
                .expectedColor(sku.getColor())
                .extractedDimensions(data.getDimensions())
                .expectedDimensions(sku.getDimensions())
                .confidence(data.getConfidenceScore())
                .issues(ocrResult.getIssues())
                .binLocation(binLocation)
                .build())
            .build();
    }

    private VerificationResponse buildMismatchResponse(
        String message,
        OCRVerificationResult ocrResult,
        Sku sku,
        Long approvalRequestId
    ) {
        OCRVerificationResult.ExtractedData data = ocrResult.getData();
        
        return VerificationResponse.builder()
            .status("MISMATCH")
            .message(message)
            .matched(false)
            .autoAssigned(false)
            .approvalRequestId(approvalRequestId)
            .details(VerificationResponse.VerificationDetails.builder()
                .extractedProductCode(data.getProductCode())
                .expectedProductCode(sku.getProduct().getProductCode())
                .extractedSku(data.getSku())
                .expectedSku(sku.getSkuCode())
                .extractedWeight(data.getWeight())
                .expectedWeight(sku.getWeight())
                .extractedColor(data.getColor())
                .expectedColor(sku.getColor())
                .extractedDimensions(data.getDimensions())
                .expectedDimensions(sku.getDimensions())
                .confidence(data.getConfidenceScore())
                .issues(ocrResult.getIssues())
                .build())
            .build();
    }

    private VerificationResponse buildErrorResponse(String message) {
        return VerificationResponse.builder()
            .status("ERROR")
            .message(message)
            .matched(false)
            .autoAssigned(false)
            .build();
    }
}






