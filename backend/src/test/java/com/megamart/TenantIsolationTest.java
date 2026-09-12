package com.megamart;

import com.megamart.model.Customer;
import com.megamart.repository.CustomerRepository;
import com.megamart.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TenantIsolationTest {

    @Autowired
    private CustomerRepository customerRepository;

    @BeforeEach
    public void setUp() {
        TenantContext.clear();
    }

    @AfterEach
    public void tearDown() {
        TenantContext.clear();
    }

    @Test
    public void testTenantDataIsolation() {
        // Query for Tenant 1
        List<Customer> tenant1Customers = customerRepository.findByTenantId(1L);
        assertFalse(tenant1Customers.isEmpty(), "Tenant 1 should have customer records");
        for (Customer c : tenant1Customers) {
            assertEquals(1L, c.getTenantId(), "All returned customers must belong to Tenant 1");
        }

        // Query for Tenant 2
        List<Customer> tenant2Customers = customerRepository.findByTenantId(2L);
        assertTrue(tenant2Customers.stream().allMatch(c -> c.getTenantId().equals(2L)), 
                "No Tenant 1 data should leak into Tenant 2 queries");
    }
}
