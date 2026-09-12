package com.megamart.dto;

import com.megamart.model.SubscriptionPlan;
import com.megamart.model.Tenant;

import java.math.BigDecimal;

public class TenantDto {
    private Long id;
    private String companyName;
    private String status;
    private Long planId;
    private String planName;
    private BigDecimal planPrice;
    private Integer maxStores;
    private Integer maxUsers;
    private long activeStoresCount;
    private long activeUsersCount;

    public TenantDto() {}

    public TenantDto(Tenant tenant, long activeStoresCount, long activeUsersCount) {
        this.id = tenant.getId();
        this.companyName = tenant.getCompanyName();
        this.status = tenant.getStatus() != null ? tenant.getStatus().name() : "ACTIVE";
        
        SubscriptionPlan plan = tenant.getPlan();
        if (plan != null) {
            this.planId = plan.getId();
            this.planName = plan.getName();
            this.planPrice = plan.getPrice();
            this.maxStores = plan.getMaxStores();
            this.maxUsers = plan.getMaxUsers();
        } else {
            this.planId = 1L;
            this.planName = "Starter Plan";
            this.planPrice = BigDecimal.valueOf(7999);
            this.maxStores = 1;
            this.maxUsers = 10;
        }

        this.activeStoresCount = activeStoresCount;
        this.activeUsersCount = activeUsersCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public BigDecimal getPlanPrice() { return planPrice; }
    public void setPlanPrice(BigDecimal planPrice) { this.planPrice = planPrice; }

    public Integer getMaxStores() { return maxStores; }
    public void setMaxStores(Integer maxStores) { this.maxStores = maxStores; }

    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }

    public long getActiveStoresCount() { return activeStoresCount; }
    public void setActiveStoresCount(long activeStoresCount) { this.activeStoresCount = activeStoresCount; }

    public long getActiveUsersCount() { return activeUsersCount; }
    public void setActiveUsersCount(long activeUsersCount) { this.activeUsersCount = activeUsersCount; }
}
