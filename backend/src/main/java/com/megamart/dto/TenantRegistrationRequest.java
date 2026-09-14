package com.megamart.dto;

public class TenantRegistrationRequest {
    private String companyName;
    private String adminName;
    private String email;
    private String password;
    private Long planId;
    private String billingCycle = "MONTHLY";
    private String paymentMethod;
    private String paymentId;
    private java.math.BigDecimal amountPaid;

    public TenantRegistrationRequest() {}

    public TenantRegistrationRequest(String companyName, String adminName, String email, String password, Long planId) {
        this.companyName = companyName;
        this.adminName = adminName;
        this.email = email;
        this.password = password;
        this.planId = planId;
        this.billingCycle = "MONTHLY";
    }

    public TenantRegistrationRequest(String companyName, String adminName, String email, String password, Long planId, String billingCycle) {
        this.companyName = companyName;
        this.adminName = adminName;
        this.email = email;
        this.password = password;
        this.planId = planId;
        this.billingCycle = billingCycle != null ? billingCycle : "MONTHLY";
    }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public String getBillingCycle() { return billingCycle != null ? billingCycle : "MONTHLY"; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public java.math.BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(java.math.BigDecimal amountPaid) { this.amountPaid = amountPaid; }

}
