package com.megamart.controller;

import com.megamart.dto.ProductDto;
import com.megamart.model.StoreInventory;
import com.megamart.security.UserPrincipal;
import com.megamart.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts(@AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(productService.getAllTenantProducts(tenantId));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<ProductDto>> getStoreInventory(
            @PathVariable Long storeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(productService.getStoreInventory(tenantId, storeId));
    }

    @GetMapping("/fefo/{storeId}")
    public ResponseEntity<List<ProductDto>> getFEFOInventory(
            @PathVariable Long storeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(productService.getFEFOInventory(tenantId, storeId));
    }

    @GetMapping("/scan")
    public ResponseEntity<ProductDto> scanBarcode(
            @RequestParam Long storeId,
            @RequestParam String barcode,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return productService.findByBarcode(tenantId, storeId, barcode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(
            @jakarta.validation.Valid @RequestBody com.megamart.dto.CreateProductRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(productService.createProduct(tenantId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody com.megamart.dto.CreateProductRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(productService.updateProduct(tenantId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        productService.deleteProduct(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/inventory/{productId}")
    public ResponseEntity<StoreInventory> updateStock(
            @PathVariable Long productId,
            @RequestParam Long storeId,
            @RequestBody Map<String, Integer> payload,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        Integer newQty = payload.get("stockQuantity");
        return ResponseEntity.ok(productService.updateStockQuantity(tenantId, storeId, productId, newQty));
    }
}
