package com.visera.backend.Controller;

import com.visera.backend.DTOs.SkuDTO;
import com.visera.backend.DTOs.SkuRequest;
import com.visera.backend.Entity.Product;
import com.visera.backend.Entity.Sku;
import com.visera.backend.Repository.ProductRepository;
import com.visera.backend.Service.SkuService;
import com.visera.backend.mapper.EntityMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skus")
@CrossOrigin(origins = "*")
public class SkuController {

    @Autowired
    EntityMapper mapper;
    
    @Autowired
    ProductRepository productRepository;

    private final SkuService skuService;

    public SkuController(SkuService skuService) {
        this.skuService = skuService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody SkuRequest request) {
        // Find the product
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));
        
        // Create SKU entity with variant fields
        Sku sku = Sku.builder()
                .product(product)
                .skuCode(request.getSkuCode())
                .color(request.getColor())
                .dimensions(request.getDimensions())
                .weight(request.getWeight())
                .build();
        
        // Create SKU and optionally create inventory stock entry
        Sku createdSku = skuService.createSkuWithInventory(sku, request.getBinId(), request.getInitialQuantity());
        return ResponseEntity.ok(createdSku);
    }

//    @GetMapping("/getallsku")
//    public ResponseEntity<List<Sku>> getAll() {
//        return ResponseEntity.ok(skuService.getAllSkus());
//    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','WORKER')")
    @GetMapping("/getbyid/{id}")
    public ResponseEntity<Sku> getById(@PathVariable int id) {
        Sku sku = skuService.getSkuById(id);
        return (sku != null) ? ResponseEntity.ok(sku) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
    @PutMapping("/update/{id}")
    public ResponseEntity<Sku> update(@PathVariable int id, @RequestBody SkuRequest request) {
        // Find the product
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));
        
        // Create SKU entity with updated fields
        Sku updatedSku = Sku.builder()
                .product(product)
                .skuCode(request.getSkuCode())
                .color(request.getColor())
                .dimensions(request.getDimensions())
                .weight(request.getWeight())
                .build();
        
        Sku sku = skuService.updateSku(id, updatedSku);
        return (sku != null) ? ResponseEntity.ok(sku) : ResponseEntity.notFound().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        skuService.deleteSku(id);
        return ResponseEntity.noContent().build();
    }

    //DTO
    @PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR','WORKER')")
    @GetMapping("/getallskudto")
    public ResponseEntity<List<SkuDTO>> getAllSkus() {
        return ResponseEntity.ok(skuService.getAllSkusWithInventory());
    }
}

