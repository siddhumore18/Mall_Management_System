package com.megamart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;

@Entity
@Table(name = "product_masters", indexes = {
    @Index(name = "idx_product_tenant_barcode", columnList = "tenant_id, barcode"),
    @Index(name = "idx_product_tenant_category", columnList = "tenant_id, category")
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class ProductMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private String barcode;

    @Column(nullable = false)
    private String name;

    @Column(name = "global_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal globalPrice;

    @Column(name = "cost_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal costPrice;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String unit = "pcs";

    @Column(name = "image_url")
    private String imageUrl;

    public ProductMaster() {}

    public ProductMaster(Long tenantId, String barcode, String name, BigDecimal globalPrice, BigDecimal costPrice, String category, String unit, String imageUrl) {
        this.tenantId = tenantId;
        this.barcode = barcode;
        this.name = name;
        this.globalPrice = globalPrice;
        this.costPrice = costPrice;
        this.category = category;
        this.unit = unit;
        this.imageUrl = imageUrl;
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
}
