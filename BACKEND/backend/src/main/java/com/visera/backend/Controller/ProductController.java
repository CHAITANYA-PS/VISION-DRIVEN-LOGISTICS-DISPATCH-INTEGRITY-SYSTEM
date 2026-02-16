package com.visera.backend.Controller;

import com.visera.backend.DTOs.ProductDTO;
import com.visera.backend.Entity.Product;
import com.visera.backend.Service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // Create product
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<Product> create(@Valid @RequestBody Product product) {
        return ResponseEntity.ok(productService.createProduct(product));
    }

//    // Get all
//    @GetMapping
//    public ResponseEntity<List<Product>> getAll() {
//        return ResponseEntity.ok(productService.getAllProducts());
//    }

    // Get by id
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        Product p = productService.getProductById(id);
        return (p != null) ? ResponseEntity.ok(p) : ResponseEntity.notFound().build();
    }

    // Update product
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @Valid @RequestBody Product updated) {
        Product p = productService.updateProduct(id, updated);
        return (p != null) ? ResponseEntity.ok(p) : ResponseEntity.notFound().build();
    }

    // Delete product
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // For DTO
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/getallproducts")
    public ResponseEntity<List<ProductDTO>> getAll() {
        return ResponseEntity.ok(
                productService.getAllProducts().stream()
                        .map(product -> {
                            ProductDTO dto = new ProductDTO();
                            dto.setId(product.getId());
                            dto.setName(product.getName());
                            dto.setDescription(product.getDescription());
                            dto.setProductCode(product.getProductCode());
                            dto.setCategory(product.getCategory());
                            dto.setStatus(product.getStatus() != null ? product.getStatus() : "Active");
                            dto.setTotalSkus(productService.getSkuCountByProductId(product.getId()));
                            dto.setCreatedAt(product.getCreatedAt());
                            return dto;
                        }).collect(java.util.stream.Collectors.toList())
        );
    }

}
