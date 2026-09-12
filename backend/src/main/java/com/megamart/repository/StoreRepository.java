package com.megamart.repository;

import com.megamart.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByTenantId(Long tenantId);
    long countByTenantId(Long tenantId);
}
