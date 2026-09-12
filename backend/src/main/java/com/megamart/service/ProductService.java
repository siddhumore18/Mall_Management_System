package com.megamart.service;

import com.megamart.dto.ProductDto;
import com.megamart.model.ProductMaster;
import com.megamart.model.StoreInventory;
import com.megamart.repository.ProductMasterRepository;
import com.megamart.repository.StoreInventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private ProductMasterRepository productMasterRepository;

    @Autowired
    private StoreInventoryRepository storeInventoryRepository;

    public List<ProductDto> getAllTenantProducts(Long tenantId) {
        return productMasterRepository.findByTenantId(tenantId).stream()
                .map(ProductDto::new)
                .toList();
    }

    public List<ProductDto> getStoreInventory(Long tenantId, Long storeId) {
        return storeInventoryRepository.findByTenantIdAndStoreId(tenantId, storeId).stream()
                .map(ProductDto::new)
                .toList();
    }

    public List<ProductDto> getFEFOInventory(Long tenantId, Long storeId) {
        return storeInventoryRepository.findFEFOInventory(tenantId, storeId).stream()
                .map(ProductDto::new)
                .toList();
    }

    public Optional<ProductDto> findByBarcode(Long tenantId, Long storeId, String barcode) {
        Optional<StoreInventory> invOpt = storeInventoryRepository.findByTenantStoreAndBarcode(tenantId, storeId, barcode);
        if (invOpt.isPresent()) {
            return Optional.of(new ProductDto(invOpt.get()));
        }
        
        return productMasterRepository.findByTenantIdAndBarcode(tenantId, barcode)
                .map(ProductDto::new);
    }

    @org.springframework.transaction.annotation.Transactional
    public ProductDto createProduct(Long tenantId, com.megamart.dto.CreateProductRequest request) {
        if (productMasterRepository.existsByTenantIdAndBarcode(tenantId, request.getBarcode())) {
            throw new RuntimeException("A product with barcode " + request.getBarcode() + " already exists in your catalog.");
        }

        ProductMaster product = new ProductMaster(
                tenantId,
                request.getBarcode(),
                request.getName(),
                request.getGlobalPrice(),
                request.getCostPrice() != null ? request.getCostPrice() : request.getGlobalPrice().multiply(java.math.BigDecimal.valueOf(0.7)),
                request.getCategory(),
                request.getUnit() != null ? request.getUnit() : "piece",
                request.getImageUrl()
        );

        ProductMaster savedProduct = productMasterRepository.save(product);

        if (request.getStoreId() != null && request.getInitialStock() != null) {
            StoreInventory inventory = new StoreInventory(
                    tenantId,
                    request.getStoreId(),
                    savedProduct,
                    Math.max(0, request.getInitialStock()),
                    request.getBatchNumber() != null ? request.getBatchNumber() : ("BATCH-" + System.currentTimeMillis() % 100000),
                    request.getExpiryDate() != null ? request.getExpiryDate() : java.time.LocalDate.now().plusMonths(6)
            );
            StoreInventory savedInv = storeInventoryRepository.save(inventory);
            return new ProductDto(savedInv);
        }

        return new ProductDto(savedProduct);
    }

    @org.springframework.transaction.annotation.Transactional
    public ProductDto updateProduct(Long tenantId, Long productId, com.megamart.dto.CreateProductRequest request) {
        ProductMaster product = productMasterRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new RuntimeException("Product not found ID: " + productId));

        if (request.getName() != null) product.setName(request.getName());
        if (request.getGlobalPrice() != null) product.setGlobalPrice(request.getGlobalPrice());
        if (request.getCostPrice() != null) product.setCostPrice(request.getCostPrice());
        if (request.getCategory() != null) product.setCategory(request.getCategory());
        if (request.getUnit() != null) product.setUnit(request.getUnit());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());

        ProductMaster updated = productMasterRepository.save(product);
        return new ProductDto(updated);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteProduct(Long tenantId, Long productId) {
        ProductMaster product = productMasterRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new RuntimeException("Product not found ID: " + productId));
        productMasterRepository.delete(product);
    }

    public StoreInventory updateStockQuantity(Long tenantId, Long storeId, Long productId, Integer newQuantity) {
        StoreInventory inventory = storeInventoryRepository.findByTenantIdAndStoreIdAndProductId(tenantId, storeId, productId)
                .orElseThrow(() -> new RuntimeException("Inventory record not found for store " + storeId + " and product " + productId));
        inventory.setStockQuantity(newQuantity);
        return storeInventoryRepository.save(inventory);
    }
}
