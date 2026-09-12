package com.megamart.repository;

import com.megamart.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByTenantIdAndPhoneNumber(Long tenantId, String phoneNumber);
    List<Customer> findByTenantId(Long tenantId);
    long countByTenantId(Long tenantId);
}
