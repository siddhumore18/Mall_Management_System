package com.megamart.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantStatus status = TenantStatus.ACTIVE;

    @Column(name = "subscription_status")
    private String subscriptionStatus = "ACTIVE";

    @Column(name = "subscription_start_date")
    private java.time.LocalDate subscriptionStartDate;

    @Column(name = "subscription_end_date")
    private java.time.LocalDate subscriptionEndDate;

    @Column(name = "billing_cycle")
    private String billingCycle = "MONTHLY";

    public Tenant() {}

    public Tenant(String companyName, SubscriptionPlan plan, TenantStatus status) {
        this.companyName = companyName;
        this.plan = plan;
        this.status = status;
        this.subscriptionStatus = "ACTIVE";
        this.subscriptionStartDate = java.time.LocalDate.now();
        this.subscriptionEndDate = java.time.LocalDate.now().plusMonths(1);
        this.billingCycle = "MONTHLY";
    }

    public Tenant(String companyName, SubscriptionPlan plan, TenantStatus status, String billingCycle, int durationMonths) {
        this.companyName = companyName;
        this.plan = plan;
        this.status = status;
        this.subscriptionStatus = "ACTIVE";
        this.subscriptionStartDate = java.time.LocalDate.now();
        this.subscriptionEndDate = java.time.LocalDate.now().plusMonths(durationMonths);
        this.billingCycle = billingCycle != null ? billingCycle : "MONTHLY";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public SubscriptionPlan getPlan() { return plan; }
    public void setPlan(SubscriptionPlan plan) { this.plan = plan; }

    public TenantStatus getStatus() { return status; }
    public void setStatus(TenantStatus status) { this.status = status; }

    public String getSubscriptionStatus() {
        if (subscriptionEndDate != null && java.time.LocalDate.now().isAfter(subscriptionEndDate)) {
            return "EXPIRED";
        }
        return subscriptionStatus != null ? subscriptionStatus : "ACTIVE";
    }
    public void setSubscriptionStatus(String subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }

    public java.time.LocalDate getSubscriptionStartDate() {
        return subscriptionStartDate != null ? subscriptionStartDate : java.time.LocalDate.now().minusDays(1);
    }
    public void setSubscriptionStartDate(java.time.LocalDate subscriptionStartDate) { this.subscriptionStartDate = subscriptionStartDate; }

    public java.time.LocalDate getSubscriptionEndDate() {
        return subscriptionEndDate != null ? subscriptionEndDate : java.time.LocalDate.now().plusDays(29);
    }
    public void setSubscriptionEndDate(java.time.LocalDate subscriptionEndDate) { this.subscriptionEndDate = subscriptionEndDate; }

    public String getBillingCycle() {
        return billingCycle != null ? billingCycle : "MONTHLY";
    }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public long getDaysRemaining() {
        java.time.LocalDate end = getSubscriptionEndDate();
        long days = java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.now(), end);
        return Math.max(0, days);
    }

    public boolean isSubscriptionActive() {
        if ("EXPIRED".equalsIgnoreCase(getSubscriptionStatus()) ||
            "CANCELLED".equalsIgnoreCase(getSubscriptionStatus()) ||
            status == TenantStatus.SUSPENDED) {
            return false;
        }
        return subscriptionEndDate == null || !java.time.LocalDate.now().isAfter(subscriptionEndDate);
    }
}
