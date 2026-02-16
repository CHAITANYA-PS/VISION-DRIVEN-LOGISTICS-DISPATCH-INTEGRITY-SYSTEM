package com.visera.backend.Service;

import com.visera.backend.DTOs.RackCreateDTO;
import com.visera.backend.DTOs.RackUpdateDTO;
import com.visera.backend.DTOs.RackWithBinsDTO;
import com.visera.backend.Entity.Rack;
import com.visera.backend.Entity.Zone;
import com.visera.backend.Repository.RackRepository;
import com.visera.backend.Repository.ZoneRepository;
import com.visera.backend.Repository.BinRepository;
import com.visera.backend.Repository.InventoryStockRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RackServiceImpl implements RackService {

    private final RackRepository repo;
    private final ZoneRepository zoneRepo;
    private final BinRepository binRepo;
    private final InventoryStockRepository inventoryStockRepo;

    public RackServiceImpl(RackRepository repo, ZoneRepository zoneRepo, BinRepository binRepo, InventoryStockRepository inventoryStockRepo) {
        this.repo = repo;
        this.zoneRepo = zoneRepo;
        this.binRepo = binRepo;
        this.inventoryStockRepo = inventoryStockRepo;
    }

    @Override
    public Rack createRack(RackCreateDTO rackCreateDTO) {
        Zone zone = zoneRepo.findById(rackCreateDTO.getZoneId())
                .orElseThrow(() -> new RuntimeException("Zone not found with id: " + rackCreateDTO.getZoneId()));
        
        Rack rack = Rack.builder()
                .zone(zone)
                .name(rackCreateDTO.getName())
                .description(rackCreateDTO.getDescription())
                .build();
        
        return repo.save(rack);
    }

    @Override
    public List<Rack> getRacksByZone(Long zoneId) {
        return repo.findByZoneId(zoneId);
    }

    @Override
    public Rack updateRack(Long rackId, RackUpdateDTO rackUpdateDTO) {
        Rack existingRack = repo.findById(rackId)
                .orElseThrow(() -> new RuntimeException("Rack not found with id: " + rackId));
        
        if (rackUpdateDTO.getName() != null && !rackUpdateDTO.getName().isEmpty()) {
            existingRack.setName(rackUpdateDTO.getName());
        }
        if (rackUpdateDTO.getDescription() != null) {
            existingRack.setDescription(rackUpdateDTO.getDescription());
        }
        
        return repo.save(existingRack);
    }

    @Override
    public void deleteRack(Long rackId) {
        // Verify rack exists
        Rack rack = repo.findById(rackId)
                .orElseThrow(() -> new RuntimeException("Rack not found with id: " + rackId));
        
        // Get all bins for this rack
        List<com.visera.backend.Entity.Bin> bins = binRepo.findByRackId(rackId);
        
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
        
        // Finally, delete the rack
        repo.deleteById(rackId);
    }

    @Override
    public List<RackWithBinsDTO> getRacksWithBinsByZone(Long zoneId) {
        List<Rack> racks = repo.findByZoneId(zoneId);
        
        return racks.stream().map(rack -> {
            RackWithBinsDTO dto = new RackWithBinsDTO();
            dto.setId(rack.getId());
            dto.setName(rack.getName());
            dto.setDescription(rack.getDescription());
            dto.setZoneId(rack.getZone().getId());
            dto.setZoneName(rack.getZone().getName());
            
            long binCount = binRepo.findByRackId(rack.getId()).size();
            dto.setBinCount(binCount);
            
            return dto;
        }).collect(Collectors.toList());
    }
}

