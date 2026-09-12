package com.megamart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "stores", indexes = {
    @Index(name = "idx_store_tenant", columnList = "tenant_id"),
    @Index(name = "idx_store_tenant_code", columnList = "tenant_id, code")
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String code;

    public Store() {}

    public Store(Long tenantId, String name, String location, String code) {
        this.tenantId = tenantId;
        this.name = name;
        this.location = location;
        this.code = code;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
