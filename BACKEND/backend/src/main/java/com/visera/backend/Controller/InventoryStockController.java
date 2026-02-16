package com.visera.backend.Controller;

import com.visera.backend.Entity.InventoryStock;
import com.visera.backend.Service.InventoryStockService;
import com.visera.backend.DTOs.InventoryStockRequest;
import com.visera.backend.DTOs.InventoryStockDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryStockController {

    private final InventoryStockService inventoryStockService;

    public InventoryStockController(InventoryStockService inventoryStockService) {
        this.inventoryStockService = inventoryStockService;
    }

    // Create or update stock using JSON Body
//    @PostMapping("/create")
//    public ResponseEntity<InventoryStock> createOrUpdateStock(
//            @RequestBody InventoryStockRequest request
//    ) {
//        InventoryStock stock = inventoryStockService.updateStock(
//                request.getSkuId(),
//                request.getBinId(),
//                request.getQuantity()
//        );
//        return ResponseEntity.ok(stock);
//    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/create")
    public ResponseEntity<InventoryStock> createStock(
            @RequestBody InventoryStock request)
    {
        return ResponseEntity.ok(inventoryStockService.createStock(request));
    }

    // Get stock for specific SKU + Bin
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/get/{skuId}/{binId}")
    public ResponseEntity<InventoryStock> getStock(
            @PathVariable int skuId,
            @PathVariable int binId
    ) {
        return ResponseEntity.ok(
                inventoryStockService.getStock(skuId, binId)
        );
    }

    // Update stock for specific SKU + Bin
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/update")
    public ResponseEntity<InventoryStock> updateStock(
            @RequestBody InventoryStockRequest request
    ) {
        InventoryStock stock = inventoryStockService.updateStock(
                request.getSkuId(),
                request.getBinId(),
                request.getQuantity()
        );
        return (stock != null) ? ResponseEntity.ok(stock) : ResponseEntity.notFound().build();
    }

    // Get all inventory with details
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR', 'WORKER')")
    @GetMapping("/all")
    public ResponseEntity<List<InventoryStockDTO>> getAllInventory() {
        return ResponseEntity.ok(inventoryStockService.getAllInventoryWithDetails());
    }

    // Delete inventory record
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteInventoryStock(@PathVariable Long id) {
        inventoryStockService.deleteInventoryStock(id);
        return ResponseEntity.noContent().build();
    }

    // Transfer stock between bins
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PostMapping("/transfer")
    public ResponseEntity<InventoryStock> transferStock(@RequestBody Map<String, Object> request) {
        Long fromBinId = Long.valueOf(request.get("fromBinId").toString());
        Long toBinId = Long.valueOf(request.get("toBinId").toString());
        Long skuId = Long.valueOf(request.get("skuId").toString());
        int quantity = Integer.parseInt(request.get("quantity").toString());
        
        InventoryStock result = inventoryStockService.transferStock(fromBinId, toBinId, skuId, quantity);
        return ResponseEntity.ok(result);
    }

    // Update quantity by inventory stock ID
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @PutMapping("/update/{id}")
    public ResponseEntity<InventoryStock> updateQuantity(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        int quantity = Integer.parseInt(request.get("quantity").toString());
        InventoryStock result = inventoryStockService.updateQuantityById(id, quantity);
        return ResponseEntity.ok(result);
    }
}
