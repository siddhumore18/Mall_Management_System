package com.megamart.dto;

public class PinAuthRequest {
    private Long tenantId;
    private String pinCode;

    public PinAuthRequest() {}

    public PinAuthRequest(Long tenantId, String pinCode) {
        this.tenantId = tenantId;
        this.pinCode = pinCode;
    }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }
}
