package com.visera.backend.Service;

import com.visera.backend.DTOs.InventoryStockDTO;
import com.visera.backend.Entity.Bin;
import com.visera.backend.Entity.InventoryStock;
import com.visera.backend.Entity.Sku;

import java.util.List;

public interface InventoryStockService {
    InventoryStock updateStock(int skuId, int binId, int quantity);
    InventoryStock addStock(int skuId, int binId, int quantity);
    InventoryStock getStock(int skuId, int binId);
    InventoryStock createStock(InventoryStock stock);
    List<InventoryStockDTO> getAllInventoryWithDetails();
    void deleteInventoryStock(Long id);
    InventoryStock transferStock(Long fromBinId, Long toBinId, Long skuId, int quantity);
    InventoryStock updateQuantityById(Long id, int quantity);
}

