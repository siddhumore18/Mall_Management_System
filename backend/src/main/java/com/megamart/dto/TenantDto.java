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
    private String subscriptionStatus;
    private String subscriptionStartDate;
    private String subscriptionEndDate;
    private long daysRemaining;
    private String billingCycle;
    private boolean isSubscriptionActive;

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
            this.planName = "Starter Boutique";
            this.planPrice = BigDecimal.valueOf(4999);
            this.maxStores = 2;
            this.maxUsers = 10;
        }

        this.activeStoresCount = activeStoresCount;
        this.activeUsersCount = activeUsersCount;
        this.subscriptionStatus = tenant.getSubscriptionStatus();
        this.subscriptionStartDate = tenant.getSubscriptionStartDate() != null ? tenant.getSubscriptionStartDate().toString() : "";
        this.subscriptionEndDate = tenant.getSubscriptionEndDate() != null ? tenant.getSubscriptionEndDate().toString() : "";
        this.daysRemaining = tenant.getDaysRemaining();
        this.billingCycle = tenant.getBillingCycle();
        this.isSubscriptionActive = tenant.isSubscriptionActive();
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

    public String getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(String subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }

    public String getSubscriptionStartDate() { return subscriptionStartDate; }
    public void setSubscriptionStartDate(String subscriptionStartDate) { this.subscriptionStartDate = subscriptionStartDate; }

    public String getSubscriptionEndDate() { return subscriptionEndDate; }
    public void setSubscriptionEndDate(String subscriptionEndDate) { this.subscriptionEndDate = subscriptionEndDate; }

    public long getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(long daysRemaining) { this.daysRemaining = daysRemaining; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public boolean isSubscriptionActive() { return isSubscriptionActive; }
    public void setSubscriptionActive(boolean subscriptionActive) { isSubscriptionActive = subscriptionActive; }

}
