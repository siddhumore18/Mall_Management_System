package com.megamart;

import com.megamart.dto.CartItemRequest;
import com.megamart.dto.TransactionRequest;
import com.megamart.model.ProductMaster;
import com.megamart.model.StoreInventory;
import com.megamart.model.Transaction;
import com.megamart.repository.ProductMasterRepository;
import com.megamart.repository.StoreInventoryRepository;
import com.megamart.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TransactionServiceTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private ProductMasterRepository productRepository;

    @Autowired
    private StoreInventoryRepository inventoryRepository;

    @Test
    public void testAtomicTransactionAndStockDeduction() {
        Long tenantId = 1L;
        Long storeId = 1L;
        Long cashierId = 5L;

        List<ProductMaster> products = productRepository.findByTenantId(tenantId);
        assertFalse(products.isEmpty());
        ProductMaster product = products.get(0);

        StoreInventory invBefore = inventoryRepository.findByTenantIdAndStoreIdAndProductId(tenantId, storeId, product.getId())
                .orElseThrow();
        int initialStock = invBefore.getStockQuantity();

        TransactionRequest req = new TransactionRequest();
        req.setStoreId(storeId);
        req.setPaymentMethod("CARD");
        req.setTaxAmount(new BigDecimal("1.00"));
        req.setDiscountAmount(BigDecimal.ZERO);
        req.setLineItems(List.of(new CartItemRequest(product.getId(), 2)));

        Transaction trx = transactionService.processTransaction(tenantId, cashierId, req);

        assertNotNull(trx.getId());
        assertEquals(tenantId, trx.getTenantId());
        assertEquals(storeId, trx.getStoreId());

        StoreInventory invAfter = inventoryRepository.findByTenantIdAndStoreIdAndProductId(tenantId, storeId, product.getId())
                .orElseThrow();
        assertEquals(initialStock - 2, invAfter.getStockQuantity(), "Stock should be reduced by exactly 2 units");
    }
}
