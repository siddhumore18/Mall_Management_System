package com.megamart.repository;

import com.megamart.model.ProductMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductMasterRepository extends JpaRepository<ProductMaster, Long> {
    Optional<ProductMaster> findByTenantIdAndBarcode(Long tenantId, String barcode);
    Optional<ProductMaster> findByIdAndTenantId(Long id, Long tenantId);
    boolean existsByTenantIdAndBarcode(Long tenantId, String barcode);
    List<ProductMaster> findByTenantId(Long tenantId);
    List<ProductMaster> findByTenantIdAndCategory(Long tenantId, String category);
}
