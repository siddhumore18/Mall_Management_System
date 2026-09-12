package com.megamart.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext
    private EntityManager entityManager;

    @Before("execution(* com.megamart.repository..*.*(..)) || execution(* com.megamart.service..*.*(..))")
    public void enableTenantFilter() {
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            try {
                Session session = entityManager.unwrap(Session.class);
                if (session != null && session.getEnabledFilter("tenantFilter") == null) {
                    session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
                }
            } catch (Exception ignored) {
                // Safely ignore if session is not active
            }
        }
    }
}
