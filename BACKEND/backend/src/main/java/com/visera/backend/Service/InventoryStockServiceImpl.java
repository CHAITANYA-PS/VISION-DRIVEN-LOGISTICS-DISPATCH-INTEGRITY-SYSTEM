package com.visera.backend.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.visera.backend.DTOs.InventoryStockDTO;
import com.visera.backend.Entity.Bin;
import com.visera.backend.Entity.InventoryStock;
import com.visera.backend.Entity.Sku;
import com.visera.backend.Repository.BinRepository;
import com.visera.backend.Repository.InventoryStockRepository;
import com.visera.backend.Repository.SkuRepository;

@Service
public class InventoryStockServiceImpl implements InventoryStockService {

    private final InventoryStockRepository repo;
    private final SkuRepository skuRepo;
    private final BinRepository binRepo;

    public InventoryStockServiceImpl(InventoryStockRepository repo,
                                     SkuRepository skuRepo,
                                     BinRepository binRepo) {
        this.repo = repo;
        this.skuRepo = skuRepo;
        this.binRepo = binRepo;
    }

    @Override
    public InventoryStock updateStock(int skuId, int binId, int quantity) {

        Sku sku = skuRepo.findById(Long.valueOf(skuId)).orElse(null);
        Bin bin = binRepo.findById(Long.valueOf(binId)).orElse(null);

        if (sku == null || bin == null) return null;

        InventoryStock stock = repo.findBySkuIdAndBinId(sku.getId(), bin.getId())
                .orElse(InventoryStock.builder()
                        .sku(sku)
                        .bin(bin)
                        .build()
                );

        stock.setQuantity(quantity);
        stock.setUpdatedAt(LocalDateTime.now());

        return repo.save(stock);
    }

    @Override
    public InventoryStock addStock(int skuId, int binId, int quantity) {
        Sku sku = skuRepo.findById(Long.valueOf(skuId)).orElse(null);
        Bin bin = binRepo.findById(Long.valueOf(binId)).orElse(null);

        if (sku == null || bin == null) return null;

        InventoryStock stock = repo.findBySkuIdAndBinId(sku.getId(), bin.getId())
                .orElse(InventoryStock.builder()
                        .sku(sku)
                        .bin(bin)
                        .quantity(0)
                        .build()
                );

        // Add quantity to existing quantity instead of replacing
        stock.setQuantity(stock.getQuantity() + quantity);
        stock.setUpdatedAt(LocalDateTime.now());

        return repo.save(stock);
    }

    @Override
    public InventoryStock createStock(InventoryStock stock) {
//        stock.setUpdatedAt(LocalDateTime.now());
        return repo.save(stock);
    }

    @Override
    public InventoryStock getStock(int skuId, int binId) {
        Sku sku = skuRepo.findById(Long.valueOf(skuId)).orElse(null);
        Bin bin = binRepo.findById(Long.valueOf(binId)).orElse(null);

        if (sku == null || bin == null) return null;

        return repo.findBySkuIdAndBinId(sku.getId(), bin.getId()).orElse(null);
    }

    @Override
    public List<InventoryStockDTO> getAllInventoryWithDetails() {
        List<InventoryStock> allStock = repo.findAll();
        return allStock.stream().map(stock -> {
            InventoryStockDTO dto = new InventoryStockDTO();
            dto.setId(stock.getId());
            dto.setSkuId(stock.getSku().getId());
            dto.setSkuCode(stock.getSku().getSkuCode());
            dto.setProductName(stock.getSku().getProduct().getName());
            dto.setBinId(stock.getBin().getId());
            dto.setBinCode(stock.getBin().getCode());
            dto.setBinName(stock.getBin().getName());
            
            // Get rack and zone names if bin has rack
            if (stock.getBin().getRack() != null) {
                dto.setRackName(stock.getBin().getRack().getName());
                if (stock.getBin().getRack().getZone() != null) {
                    dto.setZoneName(stock.getBin().getRack().getZone().getName());
                }
            }
            
            dto.setQuantity(stock.getQuantity());
            dto.setUpdatedAt(stock.getUpdatedAt());
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public void deleteInventoryStock(Long id) {
        repo.deleteById(id);
    }

    @Override
    @Transactional
    public InventoryStock transferStock(Long fromBinId, Long toBinId, Long skuId, int quantity) {
        // Get source inventory stock
        Sku sku = skuRepo.findById(skuId)
                .orElseThrow(() -> new RuntimeException("SKU not found with id: " + skuId));
        
        Bin fromBin = binRepo.findById(fromBinId)
                .orElseThrow(() -> new RuntimeException("Source bin not found with id: " + fromBinId));
        
        Bin toBin = binRepo.findById(toBinId)
                .orElseThrow(() -> new RuntimeException("Destination bin not found with id: " + toBinId));

        InventoryStock sourceStock = repo.findBySkuIdAndBinId(skuId, fromBinId)
                .orElseThrow(() -> new RuntimeException("No stock found for SKU in source bin"));

        if (sourceStock.getQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + sourceStock.getQuantity() + ", Requested: " + quantity);
        }

        // Decrease quantity from source
        sourceStock.setQuantity(sourceStock.getQuantity() - quantity);
        sourceStock.setUpdatedAt(LocalDateTime.now());
        
        if (sourceStock.getQuantity() == 0) {
            // Delete source stock if quantity becomes zero
            repo.delete(sourceStock);
        } else {
            repo.save(sourceStock);
        }

        // Increase or create destination stock
        InventoryStock destStock = repo.findBySkuIdAndBinId(skuId, toBinId).orElse(null);
        
        if (destStock != null) {
            // Update existing destination stock
            destStock.setQuantity(destStock.getQuantity() + quantity);
            destStock.setUpdatedAt(LocalDateTime.now());
            return repo.save(destStock);
        } else {
            // Create new destination stock
            InventoryStock newStock = InventoryStock.builder()
                    .sku(sku)
                    .bin(toBin)
                    .quantity(quantity)
                    .updatedAt(LocalDateTime.now())
                    .build();
            return repo.save(newStock);
        }
    }

    @Override
    public InventoryStock updateQuantityById(Long id, int quantity) {
        InventoryStock stock = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory stock not found with id: " + id));
        
        stock.setQuantity(quantity);
        stock.setUpdatedAt(LocalDateTime.now());
        return repo.save(stock);
    }
}
