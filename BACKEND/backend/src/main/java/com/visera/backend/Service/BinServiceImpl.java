package com.visera.backend.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.visera.backend.DTOs.BinCreateDTO;
import com.visera.backend.DTOs.BinUpdateDTO;
import com.visera.backend.DTOs.BinWithStatusDTO;
import com.visera.backend.Entity.Bin;
import com.visera.backend.Entity.InventoryStock;
import com.visera.backend.Entity.Rack;
import com.visera.backend.Repository.BinRepository;
import com.visera.backend.Repository.InventoryStockRepository;
import com.visera.backend.Repository.RackRepository;

@Service
public class BinServiceImpl implements BinService {

    private final BinRepository binRepo;
    private final RackRepository rackRepo;
    private final InventoryStockRepository inventoryStockRepo;

    public BinServiceImpl(BinRepository binRepo, RackRepository rackRepo, InventoryStockRepository inventoryStockRepo) {
        this.binRepo = binRepo;
        this.rackRepo = rackRepo;
        this.inventoryStockRepo = inventoryStockRepo;
    }

    @Override
    public Bin createBin(BinCreateDTO binCreateDTO) {
        // Fetch the Rack entity
        Rack rack = rackRepo.findById(binCreateDTO.getRackId())
                .orElseThrow(() -> new RuntimeException("Rack not found with id: " + binCreateDTO.getRackId()));
        
        // Create Bin entity
        Bin bin = Bin.builder()
                .rack(rack)
                .name(binCreateDTO.getName())
                .code(binCreateDTO.getCode())
                .capacity(binCreateDTO.getCapacity())
                .build();
        
        return binRepo.save(bin);
    }

    @Override
    public List<Bin> getBinsByRack(int rackId) {
        return binRepo.findByRackId((long) rackId);
    }

    @Override
    public Bin updateBin(Long binId, BinUpdateDTO binUpdateDTO) {
        Bin existingBin = binRepo.findById(binId)
                .orElseThrow(() -> new RuntimeException("Bin not found with id: " + binId));
        
        if (binUpdateDTO.getName() != null && !binUpdateDTO.getName().isEmpty()) {
            existingBin.setName(binUpdateDTO.getName());
        }
        if (binUpdateDTO.getCode() != null) {
            existingBin.setCode(binUpdateDTO.getCode());
        }
        if (binUpdateDTO.getCapacity() != null && binUpdateDTO.getCapacity() > 0) {
            existingBin.setCapacity(binUpdateDTO.getCapacity());
        }
        
        return binRepo.save(existingBin);
    }

    @Override
    public void deleteBin(Long binId) {
        // Verify bin exists
        binRepo.findById(binId)
                .orElseThrow(() -> new RuntimeException("Bin not found with id: " + binId));
        
        // Check if bin has inventory stock
        List<InventoryStock> stocks = inventoryStockRepo.findByBinId(binId);
        if (!stocks.isEmpty()) {
            // Check if any stock has quantity > 0
            boolean hasOccupiedStock = stocks.stream()
                    .anyMatch(stock -> stock.getQuantity() > 0);
            
            if (hasOccupiedStock) {
                throw new RuntimeException("Cannot delete bin that contains inventory stock. Please remove all items from the bin first.");
            }
            
            // Delete inventory stock records (even if quantity is 0)
            inventoryStockRepo.deleteAll(stocks);
        }
        
        // Delete the bin
        binRepo.deleteById(binId);
    }

    @Override
    public List<BinWithStatusDTO> getBinsWithStatusByRack(int rackId) {
        List<Bin> bins = binRepo.findByRackId((long) rackId);
        
        // Get all bin IDs
        List<Long> binIds = bins.stream()
                .map(Bin::getId)
                .collect(Collectors.toList());
        
        // Get inventory stock for all bins in one query
        List<InventoryStock> stocks = inventoryStockRepo.findByBinIdIn(binIds);
        
        // Create a map of binId -> total quantity
        Map<Long, Integer> binQuantities = stocks.stream()
                .collect(Collectors.groupingBy(
                        stock -> stock.getBin().getId(),
                        Collectors.summingInt(InventoryStock::getQuantity)
                ));
        
        // Convert to DTOs
        return bins.stream().map(bin -> {
            BinWithStatusDTO dto = new BinWithStatusDTO();
            dto.setId(bin.getId());
            dto.setName(bin.getName());
            dto.setCode(bin.getCode());
            dto.setCapacity(bin.getCapacity());
            dto.setRackId(bin.getRack() != null ? bin.getRack().getId() : null);
            dto.setRackName(bin.getRack() != null ? bin.getRack().getName() : null);
            
            // Calculate occupied status and quantity
            Integer totalQuantity = binQuantities.getOrDefault(bin.getId(), 0);
            dto.setCurrentQuantity(totalQuantity);
            dto.setIsOccupied(totalQuantity > 0);
            
            return dto;
        }).collect(Collectors.toList());
    }
}

