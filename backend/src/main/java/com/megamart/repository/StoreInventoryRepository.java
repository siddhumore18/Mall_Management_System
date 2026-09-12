package com.megamart.repository;

import com.megamart.model.StoreInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreInventoryRepository extends JpaRepository<StoreInventory, Long> {
    List<StoreInventory> findByTenantIdAndStoreId(Long tenantId, Long storeId);
    
    Optional<StoreInventory> findByTenantIdAndStoreIdAndProductId(Long tenantId, Long storeId, Long productId);
    
    @Query("SELECT i FROM StoreInventory i WHERE i.tenantId = :tenantId AND i.storeId = :storeId AND i.product.barcode = :barcode")
    Optional<StoreInventory> findByTenantStoreAndBarcode(
        @Param("tenantId") Long tenantId, 
        @Param("storeId") Long storeId, 
        @Param("barcode") String barcode
    );

    @Query("SELECT i FROM StoreInventory i WHERE i.tenantId = :tenantId AND i.storeId = :storeId ORDER BY i.expiryDate ASC NULLS LAST")
    List<StoreInventory> findFEFOInventory(@Param("tenantId") Long tenantId, @Param("storeId") Long storeId);

    List<StoreInventory> findByTenantId(Long tenantId);

    @Query("SELECT COUNT(i) FROM StoreInventory i WHERE i.tenantId = :tenantId AND i.stockQuantity < :threshold")
    long countLowStockByTenantId(@Param("tenantId") Long tenantId, @Param("threshold") Integer threshold);

    @Query("SELECT COUNT(i) FROM StoreInventory i WHERE i.tenantId = :tenantId AND i.expiryDate <= :cutoffDate AND i.stockQuantity > 0")
    long countExpiringSoonByTenantId(@Param("tenantId") Long tenantId, @Param("cutoffDate") java.time.LocalDate cutoffDate);
}
