package com.megamart.repository;

import com.megamart.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByTenantIdAndPinCode(Long tenantId, String pinCode);
    List<User> findByTenantId(Long tenantId);
    List<User> findByStoreId(Long storeId);
    long countByTenantId(Long tenantId);
}
