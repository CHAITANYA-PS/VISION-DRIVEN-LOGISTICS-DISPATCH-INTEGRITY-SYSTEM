package com.visera.backend.Repository;

import com.visera.backend.Entity.Sku;
import com.visera.backend.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SkuRepository extends JpaRepository<Sku, Long> {
//
//    Optional<Sku> findBySkuCode(String skuCode);
//
//    boolean existsBySkuCode(String skuCode);
//
//    long countByProduct(Product product);
    
    @Query("SELECT COUNT(s) FROM Sku s WHERE s.product.id = :productId")
    long countByProductId(@Param("productId") Long productId);
    
    @Query("SELECT s FROM Sku s WHERE s.product.id = :productId")
    List<Sku> findByProductId(@Param("productId") Long productId);
}
