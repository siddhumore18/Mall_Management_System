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

import com.megamart.model.TenantStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        Long planId = planIdObj != null ? Long.parseLong(planIdObj.toString()) : 1L;

        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Invalid Subscription Plan ID: " + planId));

        String billingCycle = body.get("billingCycle") != null ? body.get("billingCycle").toString() : tenant.getBillingCycle();
        if (billingCycle == null || billingCycle.isBlank()) billingCycle = "MONTHLY";

        tenant.setPlan(plan);
        tenant.setBillingCycle(billingCycle);
        tenant.setSubscriptionStatus("ACTIVE");
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setSubscriptionStartDate(LocalDate.now());
        tenant.setSubscriptionEndDate("ANNUAL".equalsIgnoreCase(billingCycle) ? LocalDate.now().plusYears(1) : LocalDate.now().plusMonths(1));

        Tenant savedTenant = tenantRepository.save(tenant);

        long storesCount = storeRepository.countByTenantId(tenantId);
        long usersCount = userRepository.countByTenantId(tenantId);

        return ResponseEntity.ok(new TenantDto(savedTenant, storesCount, usersCount));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getTenantUsers(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getTenantId() == null) {
            return ResponseEntity.status(401).build();
        }

        List<User> users = userRepository.findByTenantId(principal.getTenantId());
        List<UserDto> dtos = users.stream().map(UserDto::new).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
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

        if (!tenant.isSubscriptionActive()) {
            throw new RuntimeException("Subscription has expired. Please renew your subscription to provision new staff accounts.");
        }

        long currentUsers = userRepository.countByTenantId(tenantId);
        int maxAllowed = tenant.getPlan().getMaxUsers();
        if (currentUsers >= maxAllowed) {
            throw new RuntimeException("Subscription quota exceeded: Your " + tenant.getPlan().getName() +
                    " plan permits up to " + maxAllowed + " staff users. Please upgrade your subscription.");
        }

        String name = body.getOrDefault("name", "Staff Member").trim();
        String email = body.get("email") != null ? body.get("email").trim() : null;
        String password = body.getOrDefault("password", "password123");
        String pinCode = body.getOrDefault("pinCode", "1234");
        String roleStr = body.getOrDefault("role", "CASHIER");
        String storeIdStr = body.get("storeId");

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required to create employee credentials.");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already in use: " + email);
        }

        Role role;
        try {
            role = Role.valueOf(roleStr);
        } catch (Exception e) {
            role = Role.CASHIER;
        }

        Long storeId = null;
        if (storeIdStr != null && !storeIdStr.trim().isEmpty()) {
            try {
                storeId = Long.parseLong(storeIdStr.trim());
            } catch (Exception ignored) {}
        }
        if (storeId == null && principal != null) {
            storeId = principal.getStoreId();
        }
        if (storeId == null) {
            storeId = storeRepository.findByTenantId(tenantId).stream().findFirst().map(com.megamart.model.Store::getId).orElse(null);
        }

        String passwordHash = passwordEncoder.encode(password);

        User newUser = new User(tenantId, storeId, name, email, passwordHash, pinCode, role, "ACTIVE");
        User savedUser = userRepository.save(newUser);

        return ResponseEntity.ok(new UserDto(savedUser));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateTenantUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        
        if (principal == null || principal.getTenantId() == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        if (!principal.getTenantId().equals(user.getTenantId())) {
            return ResponseEntity.status(403).build();
        }

        if (body.containsKey("name") && body.get("name") != null && !body.get("name").isBlank()) {
            user.setName(body.get("name").trim());
        }

        if (body.containsKey("role") && body.get("role") != null) {
            try {
                user.setRole(Role.valueOf(body.get("role")));
            } catch (Exception ignored) {}
        }

        if (body.containsKey("pinCode") && body.get("pinCode") != null && !body.get("pinCode").isBlank()) {
            user.setPinCode(body.get("pinCode").trim());
        }

        if (body.containsKey("storeId") && body.get("storeId") != null && !body.get("storeId").isBlank()) {
            user.setStoreId(Long.parseLong(body.get("storeId")));
        }

        if (body.containsKey("password") && body.get("password") != null && !body.get("password").isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(body.get("password")));
        }

        if (body.containsKey("status") && body.get("status") != null) {
            user.setStatus(body.get("status").toUpperCase());
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(new UserDto(updated));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteTenantUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        
        if (principal == null || principal.getTenantId() == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        if (!principal.getTenantId().equals(user.getTenantId())) {
            return ResponseEntity.status(403).build();
        }

        // Protect self-deletion
        if (principal.getUser() != null && id.equals(principal.getUser().getId())) {
            throw new RuntimeException("Cannot de-provision your own Tenant Administrator account.");
        }

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("success", true, "message", "Employee de-provisioned successfully."));
    }
}
