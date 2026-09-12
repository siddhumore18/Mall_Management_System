package com.megamart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDate;

@Entity
@Table(name = "store_inventories", indexes = {
    @Index(name = "idx_inventory_tenant_store", columnList = "tenant_id, store_id"),
    @Index(name = "idx_inventory_tenant_store_product", columnList = "tenant_id, store_id, product_id"),
    @Index(name = "idx_inventory_fefo", columnList = "tenant_id, store_id, expiry_date")
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class StoreInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductMaster product;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Column(name = "batch_number")
    private String batchNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    public StoreInventory() {}

    public StoreInventory(Long tenantId, Long storeId, ProductMaster product, Integer stockQuantity, String batchNumber, LocalDate expiryDate) {
        this.tenantId = tenantId;
        this.storeId = storeId;
        this.product = product;
        this.stockQuantity = stockQuantity;
        this.batchNumber = batchNumber;
        this.expiryDate = expiryDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public ProductMaster getProduct() { return product; }
    public void setProduct(ProductMaster product) { this.product = product; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
}
