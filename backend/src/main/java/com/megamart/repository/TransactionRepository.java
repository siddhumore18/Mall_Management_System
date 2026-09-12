package com.megamart.repository;

import com.megamart.model.Transaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @EntityGraph(attributePaths = {"lineItems", "lineItems.product"})
    List<Transaction> findByTenantIdOrderByTimestampDesc(Long tenantId);

    @EntityGraph(attributePaths = {"lineItems", "lineItems.product"})
    List<Transaction> findByTenantIdAndStoreIdOrderByTimestampDesc(Long tenantId, Long storeId);

    @EntityGraph(attributePaths = {"lineItems", "lineItems.product"})
    List<Transaction> findByCustomerIdOrderByTimestampDesc(Long customerId);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.tenantId = :tenantId AND t.type = 'SALE'")
    BigDecimal sumTotalSalesByTenant(@Param("tenantId") Long tenantId);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM Transaction t WHERE t.tenantId = :tenantId AND t.storeId = :storeId AND t.type = 'SALE'")
    BigDecimal sumTotalSalesByStore(@Param("tenantId") Long tenantId, @Param("storeId") Long storeId);

    long countByTenantId(Long tenantId);
}
