package com.visera.backend.Repository;
import com.visera.backend.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
//    boolean existsByProductCode(String productCode);
//    Optional<Product> findByProductCode(String productCode);
}
