package com.megamart.dto;

import com.megamart.model.Role;
import com.megamart.model.User;

public class UserDto {
    private Long id;
    private Long tenantId;
    private Long storeId;
    private String name;
    private String email;
    private Role role;
    private String pinCode;
    private String status;

    public UserDto() {}

    public UserDto(User user) {
        this.id = user.getId();
        this.tenantId = user.getTenantId();
        this.storeId = user.getStoreId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.pinCode = user.getPinCode();
        this.status = user.getStatus();
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

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public String getStatus() { return status != null ? status : "ACTIVE"; }
    public void setStatus(String status) { this.status = status; }
}
