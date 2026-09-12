package com.megamart.dto;

import com.megamart.model.ProductMaster;
import com.megamart.model.StoreInventory;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ProductDto {
    private Long id;
    private Long tenantId;
    private String barcode;
    private String name;
    private BigDecimal globalPrice;
    private BigDecimal costPrice;
    private String category;
    private String unit;
    private String imageUrl;
    private Integer stockQuantity;
    private String batchNumber;
    private LocalDate expiryDate;

    public ProductDto() {}

    public ProductDto(ProductMaster product) {
        this.id = product.getId();
        this.tenantId = product.getTenantId();
        this.barcode = product.getBarcode();
        this.name = product.getName();
        this.globalPrice = product.getGlobalPrice();
        this.costPrice = product.getCostPrice();
        this.category = product.getCategory();
        this.unit = product.getUnit();
        this.imageUrl = product.getImageUrl();
    }

    public ProductDto(StoreInventory inv) {
        this(inv.getProduct());
        this.stockQuantity = inv.getStockQuantity();
        this.batchNumber = inv.getBatchNumber();
        this.expiryDate = inv.getExpiryDate();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getGlobalPrice() { return globalPrice; }
    public void setGlobalPrice(BigDecimal globalPrice) { this.globalPrice = globalPrice; }

    public BigDecimal getCostPrice() { return costPrice; }
    public void setCostPrice(BigDecimal costPrice) { this.costPrice = costPrice; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
}
