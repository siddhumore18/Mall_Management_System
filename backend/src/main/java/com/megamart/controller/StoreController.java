package com.megamart.controller;

import com.megamart.dto.UserDto;
import com.megamart.model.Store;
import com.megamart.repository.StoreRepository;
import com.megamart.repository.UserRepository;
import com.megamart.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stores")
public class StoreController {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.megamart.repository.TenantRepository tenantRepository;

    @GetMapping
    public ResponseEntity<List<Store>> getStores(@AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(storeRepository.findByTenantId(tenantId));
    }

    @PostMapping
    public ResponseEntity<Store> createStore(
            @RequestBody java.util.Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        var tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found ID: " + tenantId));

        long currentStoreCount = storeRepository.countByTenantId(tenantId);
        int maxAllowed = tenant.getPlan().getMaxStores();
        if (currentStoreCount >= maxAllowed) {
            throw new RuntimeException("Subscription quota exceeded: Your " + tenant.getPlan().getName() +
                    " plan permits up to " + maxAllowed + " stores. Please upgrade your subscription.");
        }

        String name = body.get("name");
        String location = body.getOrDefault("location", "Main Hub");
        String code = body.getOrDefault("code", "ST-" + (currentStoreCount + 101));

        if (name == null || name.isBlank()) {
            throw new RuntimeException("Store name is required");
        }

        Store store = new Store(tenantId, name, location, code);
        return ResponseEntity.ok(storeRepository.save(store));
    }

    @GetMapping("/{id}/staff")
    public ResponseEntity<List<UserDto>> getStoreStaff(@PathVariable Long id) {
        List<UserDto> staff = userRepository.findByStoreId(id).stream()
                .map(UserDto::new)
                .toList();
        return ResponseEntity.ok(staff);
    }
}
