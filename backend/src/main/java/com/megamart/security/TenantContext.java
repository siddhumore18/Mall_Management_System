package com.megamart.security;

public class TenantContext {

    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<Long> CURRENT_STORE = new ThreadLocal<>();

    public static void setCurrentTenant(Long tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static Long getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void setCurrentStore(Long storeId) {
        CURRENT_STORE.set(storeId);
    }

    public static Long getCurrentStore() {
        return CURRENT_STORE.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        CURRENT_STORE.remove();
    }
}
