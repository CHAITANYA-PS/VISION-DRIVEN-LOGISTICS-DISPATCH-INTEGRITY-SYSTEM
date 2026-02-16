package com.visera.backend.Service;


import com.visera.backend.Entity.Product;
import com.visera.backend.Entity.Sku;
import com.visera.backend.Entity.ShipmentItem;
import com.visera.backend.Entity.VerificationLog;
import com.visera.backend.Entity.Task;
import com.visera.backend.Entity.Approval;
import com.visera.backend.Repository.ProductRepository;
import com.visera.backend.Repository.SkuRepository;
import com.visera.backend.Repository.ShipmentItemRepository;
import com.visera.backend.Repository.VerificationLogRepository;
import com.visera.backend.Repository.TaskRepository;
import com.visera.backend.Repository.ApprovalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repo;
    private final SkuRepository skuRepository;
    private final ShipmentItemRepository shipmentItemRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final TaskRepository taskRepository;
    private final ApprovalRepository approvalRepository;

    public ProductServiceImpl(ProductRepository repo, SkuRepository skuRepository, 
                            ShipmentItemRepository shipmentItemRepository,
                            VerificationLogRepository verificationLogRepository,
                            TaskRepository taskRepository,
                            ApprovalRepository approvalRepository) {
        this.repo = repo;
        this.skuRepository = skuRepository;
        this.shipmentItemRepository = shipmentItemRepository;
        this.verificationLogRepository = verificationLogRepository;
        this.taskRepository = taskRepository;
        this.approvalRepository = approvalRepository;
    }

    @Override
    public Product createProduct(Product product) {
        return repo.save(product);
    }

    @Override
    public Product getProductById(Long id) {
        return repo.findById(id).orElse(null);
    }

    @Override
    public List<Product> getAllProducts() {
        return repo.findAll();
    }

    @Override
    public Product updateProduct(Long id, Product updated) {
        return repo.findById(id).map(product -> {
            product.setName(updated.getName());
            product.setDescription(updated.getDescription());
            product.setProductCode(updated.getProductCode());
            product.setCategory(updated.getCategory());
            product.setStatus(updated.getStatus());
            // Add any other fields you want to allow updating here
            return repo.save(product);
        }).orElse(null);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        // Check if product exists
        Product product = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        
        // Step 1: Find all SKUs for the product
        List<Sku> skus = skuRepository.findByProductId(id);
        
        if (!skus.isEmpty()) {
            // Step 2: Extract SKU IDs
            List<Long> skuIds = skus.stream()
                    .map(Sku::getId)
                    .collect(Collectors.toList());
            
            // Step 3: Find all ShipmentItems for those SKUs
            List<ShipmentItem> shipmentItems = shipmentItemRepository.findBySkuIdIn(skuIds);
            
            if (!shipmentItems.isEmpty()) {
                // Step 4: Extract ShipmentItem IDs
                List<Long> shipmentItemIds = shipmentItems.stream()
                        .map(ShipmentItem::getId)
                        .collect(Collectors.toList());
                
                // Step 5: Delete all Tasks for those ShipmentItems
                for (Long shipmentItemId : shipmentItemIds) {
                    List<Task> tasks = taskRepository.findByShipmentItemId(shipmentItemId);
                    if (!tasks.isEmpty()) {
                        taskRepository.deleteAll(tasks);
                    }
                }
                
                // Step 6: Delete all Approvals for those ShipmentItems
                for (Long shipmentItemId : shipmentItemIds) {
                    List<Approval> approvals = approvalRepository.findByShipmentItemId(shipmentItemId);
                    if (!approvals.isEmpty()) {
                        approvalRepository.deleteAll(approvals);
                    }
                }
                
                // Step 7: Find all VerificationLogs for those ShipmentItems
                List<VerificationLog> verificationLogs = verificationLogRepository.findByShipmentItemIdIn(shipmentItemIds);
                
                // Step 8: Delete VerificationLogs
                if (!verificationLogs.isEmpty()) {
                    verificationLogRepository.deleteAll(verificationLogs);
                }
                
                // Step 9: Delete ShipmentItems
                shipmentItemRepository.deleteAll(shipmentItems);
            }
            
            // Step 10: Delete SKUs (this will cascade delete their inventory stocks)
            // because Sku entity has @OneToMany with cascade = CascadeType.ALL for InventoryStock
            skuRepository.deleteAll(skus);
        }
        
        // Step 11: Delete the product last
        repo.deleteById(id);
    }

    @Override
    public long getSkuCountByProductId(Long productId) {
        return skuRepository.countByProductId(productId);
    }
}
