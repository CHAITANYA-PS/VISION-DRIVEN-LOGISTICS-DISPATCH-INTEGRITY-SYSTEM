package com.visera.backend.Service;
import com.visera.backend.DTOs.SkuDTO;
import com.visera.backend.Entity.Sku;
import java.util.List;

public interface SkuService {
    Sku createSku(Sku sku);
    Sku createSkuWithInventory(Sku sku, Long binId, Integer initialQuantity);
    Sku getSkuById(int id);
    List<Sku> getAllSkus();
    Sku updateSku(int id, Sku sku);
    void deleteSku(int id);
    List<SkuDTO> getAllSkusWithInventory();
}

