package com.visera.backend.Repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.visera.backend.Entity.InventoryStock;

public interface InventoryStockRepository extends JpaRepository<InventoryStock, Long> {

    List<InventoryStock> findBySkuId(Long skuId);

    List<InventoryStock> findByBinId(Long binId);
    
    List<InventoryStock> findByBinIdIn(List<Long> binIds);

    Optional<InventoryStock> findBySkuIdAndBinId(Long skuId, Long binId);
    
    long countByBinIdInAndQuantityGreaterThan(List<Long> binIds, int quantity);
    
    @Query("SELECT COALESCE(SUM(is.quantity), 0) FROM InventoryStock is WHERE is.sku.id = :skuId")
    int getTotalQuantityBySkuId(@Param("skuId") Long skuId);
    
    @Query("SELECT COALESCE(b.code, b.name, 'N/A') FROM InventoryStock is JOIN is.bin b WHERE is.sku.id = :skuId AND is.quantity > 0 ORDER BY is.quantity DESC")
    List<String> getBinLocationsBySkuId(@Param("skuId") Long skuId);
}
