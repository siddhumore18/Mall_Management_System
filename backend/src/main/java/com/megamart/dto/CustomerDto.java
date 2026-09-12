package com.megamart.dto;

import com.megamart.model.Customer;
import java.math.BigDecimal;

public class CustomerDto {
    private Long id;
    private Long tenantId;
    private String phoneNumber;
    private String name;
    private Integer loyaltyPoints;
    private BigDecimal lifetimeValue;

    public CustomerDto() {}

    public CustomerDto(Customer customer) {
        this.id = customer.getId();
        this.tenantId = customer.getTenantId();
        this.phoneNumber = customer.getPhoneNumber();
        this.name = customer.getName();
        this.loyaltyPoints = customer.getLoyaltyPoints();
        this.lifetimeValue = customer.getLifetimeValue();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }

    public BigDecimal getLifetimeValue() { return lifetimeValue; }
    public void setLifetimeValue(BigDecimal lifetimeValue) { this.lifetimeValue = lifetimeValue; }
}
