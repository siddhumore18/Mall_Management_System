package com.megamart.service;

import com.megamart.dto.*;
import com.megamart.model.*;
import com.megamart.repository.*;
import com.megamart.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = tokenProvider.generateToken(user);
        return new AuthResponse(token, new UserDto(user));
    }

    public AuthResponse pinLogin(PinAuthRequest request) {
        User user = userRepository.findByTenantIdAndPinCode(request.getTenantId(), request.getPinCode())
                .orElseThrow(() -> new RuntimeException("Invalid PIN code for tenant"));

        String token = tokenProvider.generateToken(user);
        return new AuthResponse(token, new UserDto(user));
    }

    @Transactional
    public AuthResponse registerTenant(TenantRegistrationRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        SubscriptionPlan plan = planRepository.findById(request.getPlanId() != null ? request.getPlanId() : 1L)
                .orElseThrow(() -> new RuntimeException("Invalid subscription plan ID: " + request.getPlanId()));

        String billingCycle = (request.getBillingCycle() != null && !request.getBillingCycle().isBlank())
                ? request.getBillingCycle().toUpperCase() : "MONTHLY";
        int durationMonths = "ANNUAL".equalsIgnoreCase(billingCycle) ? 12 : 1;

        // 1. Create Tenant with Subscription Timeline
        Tenant tenant = new Tenant(request.getCompanyName(), plan, TenantStatus.ACTIVE, billingCycle, durationMonths);
        tenant.setAdminName(request.getAdminName());
        tenant.setAdminEmail(request.getEmail());
        tenant.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "Razorpay UPI");
        tenant.setPaymentId(request.getPaymentId() != null ? request.getPaymentId() : "pay_" + System.currentTimeMillis());
        
        java.math.BigDecimal price = "ANNUAL".equalsIgnoreCase(billingCycle) 
                ? plan.getPrice().multiply(new java.math.BigDecimal("0.8")).multiply(new java.math.BigDecimal("12")) 
                : plan.getPrice();
        tenant.setAmountPaid(request.getAmountPaid() != null ? request.getAmountPaid() : price);
        tenant.setInvoiceNumber("MM-SAAS-" + String.format("%05d", System.currentTimeMillis() % 100000));
        tenant.setGstin("27AAAAA0000A1Z5");
        
        Tenant savedTenant = tenantRepository.save(tenant);

        // 2. Create Initial Flagship Store
        Store initialStore = storeRepository.save(new Store(savedTenant.getId(), request.getCompanyName() + " Flagship", "Main City Center", "ST-101"));

        // 3. Create Tenant Admin User
        String passwordHash = passwordEncoder.encode(request.getPassword());
        User adminUser = new User(savedTenant.getId(), initialStore.getId(), request.getAdminName(), request.getEmail(), passwordHash, "1234", Role.TENANT_ADMIN);
        User savedUser = userRepository.save(adminUser);

        String token = tokenProvider.generateToken(savedUser);
        return new AuthResponse(token, new UserDto(savedUser));
    }
}
