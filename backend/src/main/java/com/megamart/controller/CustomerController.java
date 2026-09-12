package com.megamart.controller;

import com.megamart.dto.CustomerDto;
import com.megamart.model.Transaction;
import com.megamart.security.UserPrincipal;
import com.megamart.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @GetMapping("/lookup")
    public ResponseEntity<CustomerDto> lookupByPhone(
            @RequestParam String phone,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return customerService.lookupByPhone(tenantId, phone)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<CustomerDto>> getAllCustomers(@AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(customerService.getAllCustomers(tenantId));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<Transaction>> getCustomerHistory(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerHistory(id));
    }

    @PostMapping
    public ResponseEntity<CustomerDto> createCustomer(
            @RequestBody CustomerDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal != null ? principal.getTenantId() : 1L;
        com.megamart.model.Customer customer = customerService.getOrCreateCustomer(tenantId, request.getPhoneNumber(), request.getName());
        return ResponseEntity.ok(new CustomerDto(customer));
    }
}
