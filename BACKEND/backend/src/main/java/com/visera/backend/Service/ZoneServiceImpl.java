package com.visera.backend.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Comparator;

import org.springframework.stereotype.Service;

import com.visera.backend.DTOs.ZoneStatisticsDTO;
import com.visera.backend.DTOs.ZoneUpdateDTO;
import com.visera.backend.DTOs.ZoneProductAllocationDTO;
import com.visera.backend.DTOs.BinAllocationDTO;
import com.visera.backend.Entity.Zone;
import com.visera.backend.Entity.InventoryStock;
import com.visera.backend.Repository.BinRepository;
import com.visera.backend.Repository.InventoryStockRepository;
import com.visera.backend.Repository.RackRepository;
import com.visera.backend.Repository.ZoneRepository;

@Service
public class ZoneServiceImpl implements ZoneService {

    private final ZoneRepository zoneRepo;
    private final RackRepository rackRepo;
    private final BinRepository binRepo;
    private final InventoryStockRepository inventoryStockRepo;

    public ZoneServiceImpl(ZoneRepository zoneRepo,
                           RackRepository rackRepo,
                           BinRepository binRepo,
                           InventoryStockRepository inventoryStockRepo) {
        this.zoneRepo = zoneRepo;
        this.rackRepo = rackRepo;
        this.binRepo = binRepo;
        this.inventoryStockRepo = inventoryStockRepo;
    }

    @Override
    public Zone createZone(Zone zone) {
        return zoneRepo.save(zone);
    }

    @Override
    public List<Zone> getAllZones() {
        return zoneRepo.findAll();
    }

    @Override
    public Zone getZoneById(Long zoneId) {
        return zoneRepo.findById(zoneId).orElse(null);
    }

    @Override
    public Zone updateZone(Long zoneId, ZoneUpdateDTO zoneUpdateDTO) {
        Zone existingZone = zoneRepo.findById(zoneId).orElse(null);
        if (existingZone == null) return null;
        
        if (zoneUpdateDTO.getName() != null && !zoneUpdateDTO.getName().isEmpty()) {
            existingZone.setName(zoneUpdateDTO.getName());
        }
        if (zoneUpdateDTO.getDescription() != null) {
            existingZone.setDescription(zoneUpdateDTO.getDescription());
        }
        return zoneRepo.save(existingZone);
    }

    @Override
    public void deleteZone(Long zoneId) {
        // Verify zone exists
        zoneRepo.findById(zoneId)
                .orElseThrow(() -> new RuntimeException("Zone not found with id: " + zoneId));
        
        // Get all racks for this zone
        List<com.visera.backend.Entity.Rack> racks = rackRepo.findByZoneId(zoneId);
        
        // For each rack, delete all bins and their inventory stock
        for (com.visera.backend.Entity.Rack rack : racks) {
            List<com.visera.backend.Entity.Bin> bins = binRepo.findByRackId(rack.getId());
            
            // Delete inventory stock for all bins in this rack
            for (com.visera.backend.Entity.Bin bin : bins) {
                List<com.visera.backend.Entity.InventoryStock> stocks = inventoryStockRepo.findByBinId(bin.getId());
                if (!stocks.isEmpty()) {
                    inventoryStockRepo.deleteAll(stocks);
                }
            }
            
            // Delete all bins in this rack
            if (!bins.isEmpty()) {
                binRepo.deleteAll(bins);
            }
        }
        
        // Delete all racks in this zone
        if (!racks.isEmpty()) {
            rackRepo.deleteAll(racks);
        }
        
        // Finally, delete the zone
        zoneRepo.deleteById(zoneId);
    }

    @Override
    public List<ZoneStatisticsDTO> getAllZoneStatistics() {
        List<Zone> zones = zoneRepo.findAll();
        
        return zones.stream().map(zone -> {
            ZoneStatisticsDTO dto = new ZoneStatisticsDTO();
            dto.setZoneId(zone.getId());
            dto.setZoneName(zone.getName());
            dto.setDescription(zone.getDescription());
            
            // Get all racks for this zone
            List<com.visera.backend.Entity.Rack> racks = rackRepo.findByZoneId(zone.getId());
            dto.setTotalRacks(racks.size());
            
            // Get all bins for racks in this zone
            List<Long> rackIds = racks.stream()
                    .map(com.visera.backend.Entity.Rack::getId)
                    .collect(Collectors.toList());
            
            long totalBins = 0;
            List<Long> binIds = new java.util.ArrayList<>();
            
            for (Long rackId : rackIds) {
                List<com.visera.backend.Entity.Bin> bins = binRepo.findByRackId(rackId);
                totalBins += bins.size();
                binIds.addAll(bins.stream()
                        .map(com.visera.backend.Entity.Bin::getId)
                        .collect(Collectors.toList()));
            }
            
            dto.setTotalBins(totalBins);
            
            // Count occupied bins (bins with quantity > 0 in inventory_stock)
            long occupiedBins = 0;
            if (!binIds.isEmpty()) {
                occupiedBins = inventoryStockRepo.countByBinIdInAndQuantityGreaterThan(binIds, 0);
            }
            
            dto.setOccupiedBins(occupiedBins);
            
            // Calculate occupancy percentage
            double occupancyPercentage = totalBins > 0 
                ? (occupiedBins * 100.0) / totalBins 
                : 0.0;
            dto.setOccupancyPercentage(Math.round(occupancyPercentage * 10.0) / 10.0);
            
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<ZoneProductAllocationDTO> getProductAllocationByZone(Long zoneId) {
        // Get all racks in the zone
        List<com.visera.backend.Entity.Rack> racks = rackRepo.findByZoneId(zoneId);
        
        // Get all bins in those racks
        List<Long> rackIds = racks.stream()
                .map(com.visera.backend.Entity.Rack::getId)
                .collect(Collectors.toList());
        
        List<Long> binIds = new java.util.ArrayList<>();
        for (Long rackId : rackIds) {
            List<com.visera.backend.Entity.Bin> bins = binRepo.findByRackId(rackId);
            binIds.addAll(bins.stream()
                    .map(com.visera.backend.Entity.Bin::getId)
                    .collect(Collectors.toList()));
        }
        
        // If no bins, return empty list
        if (binIds.isEmpty()) {
            return new java.util.ArrayList<>();
        }
        
        // Get all inventory stock for those bins
        List<InventoryStock> stocks = inventoryStockRepo.findByBinIdIn(binIds);
        
        // Filter out stocks with quantity <= 0
        stocks = stocks.stream()
                .filter(stock -> stock.getQuantity() > 0)
                .collect(Collectors.toList());
        
        // Group by SKU
        Map<com.visera.backend.Entity.Sku, List<InventoryStock>> stocksBySku = stocks.stream()
                .collect(Collectors.groupingBy(InventoryStock::getSku));
        
        // Convert to DTOs
        return stocksBySku.entrySet().stream()
                .map(entry -> {
                    com.visera.backend.Entity.Sku sku = entry.getKey();
                    List<InventoryStock> skuStocks = entry.getValue();
                    
                    // Calculate total quantity
                    int totalQuantity = skuStocks.stream()
                            .mapToInt(InventoryStock::getQuantity)
                            .sum();
                    
                    // Create bin allocations
                    List<BinAllocationDTO> binAllocations = skuStocks.stream()
                            .map(stock -> {
                                com.visera.backend.Entity.Bin bin = stock.getBin();
                                String rackName = bin.getRack() != null ? bin.getRack().getName() : "N/A";
                                
                                return BinAllocationDTO.builder()
                                        .binId(bin.getId())
                                        .binCode(bin.getCode())
                                        .binName(bin.getName())
                                        .rackName(rackName)
                                        .quantity(stock.getQuantity())
                                        .build();
                            })
                            .sorted(Comparator.comparing(BinAllocationDTO::getRackName)
                                    .thenComparing(BinAllocationDTO::getBinName))
                            .collect(Collectors.toList());
                    
                    return ZoneProductAllocationDTO.builder()
                            .skuId(sku.getId())
                            .skuCode(sku.getSkuCode())
                            .productName(sku.getProduct() != null ? sku.getProduct().getName() : "N/A")
                            .totalQuantity(totalQuantity)
                            .binAllocations(binAllocations)
                            .build();
                })
                .sorted(Comparator.comparing(ZoneProductAllocationDTO::getProductName))
                .collect(Collectors.toList());
    }
}

