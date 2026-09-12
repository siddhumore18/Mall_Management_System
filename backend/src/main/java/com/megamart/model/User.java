package com.megamart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_tenant", columnList = "tenant_id"),
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_tenant_pin", columnList = "tenant_id, pin_code"),
    @Index(name = "idx_user_tenant_role", columnList = "tenant_id, role")
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private Long tenantId; // null for SUPER_ADMIN

    @Column(name = "store_id")
    private Long storeId; // null for ADMIN/ACCOUNTANT

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "pin_code", length = 4)
    private String pinCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    public User() {}

    public User(Long tenantId, Long storeId, String name, String email, String passwordHash, String pinCode, Role role) {
        this.tenantId = tenantId;
        this.storeId = storeId;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.pinCode = pinCode;
        this.role = role;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
