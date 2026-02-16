package com.visera.backend.Service;

import com.visera.backend.Entity.Product;

import java.util.List;

public interface ProductService {
    Product createProduct(Product product);
    Product getProductById(Long id);
    List<Product> getAllProducts();

    // New methods to support update and delete operations
    Product updateProduct(Long id, Product product);
    void deleteProduct(Long id);
    long getSkuCountByProductId(Long productId);
}

