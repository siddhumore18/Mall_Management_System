package com.megamart.controller;

import com.megamart.dto.TenantDto;
import com.megamart.dto.UserDto;
import com.megamart.model.Role;
import com.megamart.model.SubscriptionPlan;
import com.megamart.model.Tenant;
import com.megamart.model.User;
import com.megamart.repository.StoreRepository;
import com.megamart.repository.SubscriptionPlanRepository;
import com.megamart.repository.TenantRepository;
import com.megamart.repository.UserRepository;
import com.megamart.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tenant")
public class TenantController {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<TenantDto> getMyTenant(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getTenantId() == null) {
            return ResponseEntity.status(401).build();
        }

        Long tenantId = principal.getTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found ID: " + tenantId));

        long storesCount = storeRepository.countByTenantId(tenantId);
        long usersCount = userRepository.countByTenantId(tenantId);

        return ResponseEntity.ok(new TenantDto(tenant, storesCount, usersCount));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<TenantDto> upgradeSubscription(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Object> body) {
        
        if (principal == null || principal.getTenantId() == null) {
            return ResponseEntity.status(401).build();
        }

        Long tenantId = principal.getTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found ID: " + tenantId));

        Object planIdObj = body.get("planId");
        Long planId = planIdObj != null ? Long.parseLong(planIdObj.toString()) : 3L;

        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Invalid Subscription Plan ID: " + planId));

        tenant.setPlan(plan);
        Tenant savedTenant = tenantRepository.save(tenant);

        long storesCount = storeRepository.countByTenantId(tenantId);
        long usersCount = userRepository.countByTenantId(tenantId);

        return ResponseEntity.ok(new TenantDto(savedTenant, storesCount, usersCount));
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createTenantUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {
        
        if (principal == null || principal.getTenantId() == null) {
            return ResponseEntity.status(401).build();
        }

        Long tenantId = principal.getTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found ID: " + tenantId));

        long currentUsers = userRepository.countByTenantId(tenantId);
        int maxAllowed = tenant.getPlan().getMaxUsers();
        if (currentUsers >= maxAllowed) {
            throw new RuntimeException("Subscription quota exceeded: Your " + tenant.getPlan().getName() +
                    " plan permits up to " + maxAllowed + " staff users. Please upgrade your subscription.");
        }

        String name = body.getOrDefault("name", "Staff Member");
        String email = body.get("email");
        String password = body.getOrDefault("password", "password123");
        String pinCode = body.getOrDefault("pinCode", "1234");
        String roleStr = body.getOrDefault("role", "CASHIER");
        String storeIdStr = body.get("storeId");

        if (email != null && userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already in use: " + email);
        }

        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (Exception e) {
            role = Role.CASHIER;
        }

        Long storeId = storeIdStr != null && !storeIdStr.isEmpty() ? Long.parseLong(storeIdStr) : principal.getStoreId();
        String passwordHash = passwordEncoder.encode(password);

        User newUser = new User(tenantId, storeId, name, email != null ? email : (name.toLowerCase().replaceAll("\\s+", "") + "@megamart.com"), passwordHash, pinCode, role);
        User savedUser = userRepository.save(newUser);

        return ResponseEntity.ok(new UserDto(savedUser));
    }
}
