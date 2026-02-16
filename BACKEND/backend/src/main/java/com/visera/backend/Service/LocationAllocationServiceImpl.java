package com.visera.backend.Service;

import com.visera.backend.DTOs.BinAllocation;
import com.visera.backend.DTOs.LocationAllocationResult;
import com.visera.backend.Entity.*;
import com.visera.backend.Repository.BinRepository;
import com.visera.backend.Repository.InventoryStockRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LocationAllocationServiceImpl implements LocationAllocationService {

    private final InventoryStockRepository inventoryStockRepository;
    private final BinRepository binRepository;

    public LocationAllocationServiceImpl(
            InventoryStockRepository inventoryStockRepository,
            BinRepository binRepository) {
        this.inventoryStockRepository = inventoryStockRepository;
        this.binRepository = binRepository;
    }

    @Override
    public Bin suggestOptimalLocation(Sku sku, Integer quantity) {
        LocationAllocationResult result = allocateLocationWithOverflow(sku, quantity);
        return result != null ? result.getPrimaryBin() : null;
    }

    /**
     * Check if zone has sufficient capacity for required quantity
     */
    public ZoneCapacityInfo checkZoneCapacity(Zone zone, Integer requiredQuantity) {
        List<Bin> zoneBins = binRepository.findByRackZoneId(zone.getId());
        
        int totalCapacity = 0;
        int totalUsed = 0;
        
        for (Bin bin : zoneBins) {
            int binCapacity = bin.getCapacity() != null ? bin.getCapacity() : Integer.MAX_VALUE;
            if (binCapacity != Integer.MAX_VALUE) {
                totalCapacity += binCapacity;
            }
            
            // Get current quantity in this bin (sum across all SKUs)
            List<InventoryStock> stocks = inventoryStockRepository.findByBinId(bin.getId());
            int binUsed = stocks.stream().mapToInt(InventoryStock::getQuantity).sum();
            totalUsed += binUsed;
        }
        
        int totalAvailable = totalCapacity - totalUsed;
        boolean hasCapacity = totalAvailable >= requiredQuantity;
        
        return new ZoneCapacityInfo(hasCapacity, totalCapacity, totalUsed, totalAvailable);
    }

    @Override
    public LocationAllocationResult allocateLocationWithOverflow(Sku sku, Integer quantity) {
        // Step 1: Find SKU's assigned bin (prioritize by quantity DESC to get primary location)
        List<InventoryStock> existingStocks = inventoryStockRepository.findBySkuId(sku.getId());
        Bin assignedBin = null;
        InventoryStock assignedStock = null;
        Zone assignedZone = null;

        if (!existingStocks.isEmpty()) {
            // Sort by quantity DESC to get the bin with most stock (primary location)
            assignedStock = existingStocks.stream()
                    .sorted(Comparator.comparing(InventoryStock::getQuantity).reversed())
                    .findFirst()
                    .orElse(existingStocks.get(0));
            assignedBin = assignedStock.getBin();
            if (assignedBin != null && assignedBin.getRack() != null) {
                assignedZone = assignedBin.getRack().getZone();
            }
        }

        // If no assigned bin exists, find bin in zone matching product category
        if (assignedBin == null) {
            // Try to find a bin in a zone that matches the product category
            // For now, we'll use the first available zone - this can be enhanced later
            List<Bin> allBins = binRepository.findAll();
            if (!allBins.isEmpty()) {
                assignedBin = allBins.get(0);
                if (assignedBin.getRack() != null) {
                    assignedZone = assignedBin.getRack().getZone();
                }
            } else {
                return LocationAllocationResult.builder()
                        .hasError(true)
                        .errorMessage("No bins available in warehouse")
                        .zoneCapacityFull(false)
                        .build();
            }
        }

        if (assignedZone == null) {
            return LocationAllocationResult.builder()
                    .hasError(true)
                    .errorMessage("No zone found for bin assignment")
                    .zoneCapacityFull(false)
                    .build();
        }

        // Step 1.5: Check zone capacity before proceeding
        ZoneCapacityInfo zoneCapacity = checkZoneCapacity(assignedZone, quantity);
        if (!zoneCapacity.hasCapacity) {
            return LocationAllocationResult.builder()
                    .hasError(true)
                    .errorMessage(String.format(
                        "Zone '%s' capacity is full. Total capacity: %d, Used: %d, Available: %d, Required: %d. Please request bin location allocation.",
                        assignedZone.getName(),
                        zoneCapacity.totalCapacity,
                        zoneCapacity.totalUsed,
                        zoneCapacity.totalAvailable,
                        quantity
                    ))
                    .zoneCapacityFull(true)
                    .zoneId(assignedZone.getId())
                    .zoneName(assignedZone.getName())
                    .totalZoneCapacity(zoneCapacity.totalCapacity)
                    .totalZoneUsed(zoneCapacity.totalUsed)
                    .totalZoneAvailable(zoneCapacity.totalAvailable)
                    .build();
        }

        // Step 2: Check capacity
        int currentQuantity = assignedStock != null ? assignedStock.getQuantity() : 0;
        int binCapacity = assignedBin.getCapacity() != null ? assignedBin.getCapacity() : Integer.MAX_VALUE;
        int availableCapacity = binCapacity - currentQuantity;

        List<BinAllocation> binAllocations = new ArrayList<>();

        // Step 3: Handle overflow
        if (quantity <= availableCapacity) {
            // Store all in assigned bin
            BinAllocation allocation = BinAllocation.builder()
                    .binId(assignedBin.getId())
                    .binCode(assignedBin.getCode())
                    .binName(assignedBin.getName())
                    .quantity(quantity)
                    .availableCapacity(availableCapacity)
                    .build();
            binAllocations.add(allocation);
        } else {
            // Fill assigned bin to capacity
            BinAllocation primaryAllocation = BinAllocation.builder()
                    .binId(assignedBin.getId())
                    .binCode(assignedBin.getCode())
                    .binName(assignedBin.getName())
                    .quantity(availableCapacity)
                    .availableCapacity(availableCapacity)
                    .build();
            binAllocations.add(primaryAllocation);

            // Remaining quantity
            final int remainingQuantityInitial = quantity - availableCapacity;
            int remainingQuantity = remainingQuantityInitial;

            // Step 4: Find additional bins in same zone
            List<Bin> zoneBins = binRepository.findByRackZoneId(assignedZone.getId());
            
            // Make assignedBin effectively final for lambda
            final Bin finalAssignedBin = assignedBin;
            final Long assignedBinId = finalAssignedBin.getId();
            
            // Filter and sort bins
            List<BinWithCapacity> binsWithCapacity = zoneBins.stream()
                    .filter(bin -> !bin.getId().equals(assignedBinId)) // Exclude assigned bin
                    .map(bin -> {
                        InventoryStock stock = inventoryStockRepository.findBySkuIdAndBinId(sku.getId(), bin.getId())
                                .orElse(null);
                        int currentQty = stock != null ? stock.getQuantity() : 0;
                        int capacity = bin.getCapacity() != null ? bin.getCapacity() : Integer.MAX_VALUE;
                        int available = capacity - currentQty;
                        return new BinWithCapacity(bin, available, stock != null);
                    })
                    .filter(bwc -> bwc.availableCapacity > 0) // Only bins with available capacity
                    .sorted(Comparator
                            .comparing((BinWithCapacity bwc) -> bwc.hasSameSku ? 0 : 1) // Prefer bins with same SKU
                            .thenComparing(Comparator.comparing((BinWithCapacity bwc) -> bwc.availableCapacity).reversed())) // Then by capacity
                    .collect(Collectors.toList());

            // Allocate remaining quantity
            for (BinWithCapacity bwc : binsWithCapacity) {
                if (remainingQuantity <= 0) break;

                int quantityToAllocate = Math.min(remainingQuantity, bwc.availableCapacity);
                BinAllocation allocation = BinAllocation.builder()
                        .binId(bwc.bin.getId())
                        .binCode(bwc.bin.getCode())
                        .binName(bwc.bin.getName())
                        .quantity(quantityToAllocate)
                        .availableCapacity(bwc.availableCapacity)
                        .build();
                binAllocations.add(allocation);
                remainingQuantity -= quantityToAllocate;
            }

            // If still have remaining quantity, we couldn't allocate all
            if (remainingQuantity > 0) {
                // Check zone capacity again for remaining quantity
                ZoneCapacityInfo remainingCapacity = checkZoneCapacity(assignedZone, remainingQuantity);
                if (!remainingCapacity.hasCapacity) {
                    return LocationAllocationResult.builder()
                            .hasError(true)
                            .errorMessage(String.format(
                                "Zone '%s' capacity insufficient for remaining quantity. Available: %d, Required: %d. Please request bin location allocation.",
                                assignedZone.getName(),
                                remainingCapacity.totalAvailable,
                                remainingQuantity
                            ))
                            .zoneCapacityFull(true)
                            .zoneId(assignedZone.getId())
                            .zoneName(assignedZone.getName())
                            .totalZoneCapacity(remainingCapacity.totalCapacity)
                            .totalZoneUsed(remainingCapacity.totalUsed)
                            .totalZoneAvailable(remainingCapacity.totalAvailable)
                            .binAllocations(binAllocations) // Return partial allocation
                            .build();
                }
            }
        }

        // Format location string
        String suggestedLocation = formatBinLocation(assignedBin, assignedZone);

        return LocationAllocationResult.builder()
                .primaryBin(assignedBin)
                .suggestedLocation(suggestedLocation)
                .binAllocations(binAllocations)
                .zoneId(assignedZone.getId())
                .zoneName(assignedZone.getName())
                .hasError(false)
                .zoneCapacityFull(false)
                .totalZoneCapacity(zoneCapacity.totalCapacity)
                .totalZoneUsed(zoneCapacity.totalUsed)
                .totalZoneAvailable(zoneCapacity.totalAvailable)
                .build();
    }

    private String formatBinLocation(Bin bin, Zone zone) {
        Rack rack = bin.getRack();
        String binCode = bin.getCode() != null ? bin.getCode() : bin.getName();
        String zoneName = zone.getName();
        String rackName = rack != null ? rack.getName() : "";
        
        if (rackName.isEmpty()) {
            return String.format("%s / %s", zoneName, binCode);
        }
        return String.format("%s / %s", zoneName, binCode);
    }

    // Helper class for bin capacity calculation
    private static class BinWithCapacity {
        Bin bin;
        int availableCapacity;
        boolean hasSameSku;

        BinWithCapacity(Bin bin, int availableCapacity, boolean hasSameSku) {
            this.bin = bin;
            this.availableCapacity = availableCapacity;
            this.hasSameSku = hasSameSku;
        }
    }

    // Helper class for zone capacity information
    private static class ZoneCapacityInfo {
        boolean hasCapacity;
        int totalCapacity;
        int totalUsed;
        int totalAvailable;

        ZoneCapacityInfo(boolean hasCapacity, int totalCapacity, int totalUsed, int totalAvailable) {
            this.hasCapacity = hasCapacity;
            this.totalCapacity = totalCapacity;
            this.totalUsed = totalUsed;
            this.totalAvailable = totalAvailable;
        }
    }
}
