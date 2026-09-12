package com.megamart.service;

import com.megamart.dto.CartItemRequest;
import com.megamart.dto.TransactionRequest;
import com.megamart.model.*;
import com.megamart.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ProductMasterRepository productMasterRepository;

    @Autowired
    private StoreInventoryRepository storeInventoryRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerService customerService;

    @Transactional
    public Transaction processTransaction(Long tenantId, Long cashierId, TransactionRequest request) {
        Long storeId = request.getStoreId();

        if (request.getLineItems() == null || request.getLineItems().isEmpty()) {
            throw new RuntimeException("Cart is empty: At least one item is required to complete a transaction.");
        }

        // Customer auto-resolution or silent creation with tenant isolation
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .filter(c -> c.getTenantId().equals(tenantId))
                    .orElse(null);
        } else if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            customer = customerService.getOrCreateCustomer(tenantId, request.getCustomerPhone(), request.getCustomerName());
        }

        BigDecimal subtotalSum = BigDecimal.ZERO;

        Transaction transaction = new Transaction(
                tenantId,
                storeId,
                cashierId,
                customer != null ? customer.getId() : null,
                BigDecimal.ZERO,
                request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO,
                request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO,
                request.getPaymentMethod(),
                TransactionType.SALE
        );

        for (CartItemRequest itemReq : request.getLineItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new RuntimeException("Invalid item quantity for product ID: " + itemReq.getProductId());
            }

            ProductMaster product = productMasterRepository.findByIdAndTenantId(itemReq.getProductId(), tenantId)
                    .orElseThrow(() -> new RuntimeException("Product not found or does not belong to tenant: " + itemReq.getProductId()));

            // Stock deduction
            StoreInventory inventory = storeInventoryRepository.findByTenantIdAndStoreIdAndProductId(tenantId, storeId, product.getId())
                    .orElseThrow(() -> new RuntimeException("Product " + product.getName() + " is not available at store " + storeId));

            if (inventory.getStockQuantity() < itemReq.getQuantity()) {
                throw new RuntimeException("Insufficient stock for " + product.getName() + ". Available: " + inventory.getStockQuantity() + ", Requested: " + itemReq.getQuantity());
            }

            inventory.setStockQuantity(inventory.getStockQuantity() - itemReq.getQuantity());
            storeInventoryRepository.save(inventory);

            BigDecimal lineSubtotal = product.getGlobalPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotalSum = subtotalSum.add(lineSubtotal);

            TransactionLineItem lineItem = new TransactionLineItem(product, itemReq.getQuantity(), product.getGlobalPrice(), lineSubtotal);
            transaction.addLineItem(lineItem);
        }

        // Discount cannot exceed subtotal
        if (transaction.getDiscountAmount().compareTo(subtotalSum) > 0) {
            transaction.setDiscountAmount(subtotalSum);
        }

        BigDecimal finalTotal = subtotalSum.add(transaction.getTaxAmount()).subtract(transaction.getDiscountAmount());
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            finalTotal = BigDecimal.ZERO;
        }
        transaction.setTotalAmount(finalTotal);

        Transaction savedTransaction = transactionRepository.save(transaction);

        // Update customer lifetime value and loyalty points
        if (customer != null) {
            customer.setLifetimeValue(customer.getLifetimeValue().add(finalTotal));
            int pointsEarned = finalTotal.divide(BigDecimal.TEN, 0, RoundingMode.DOWN).intValue();
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() + pointsEarned);
            customerRepository.save(customer);
        }

        return savedTransaction;
    }

    public List<Transaction> getTenantTransactions(Long tenantId) {
        return transactionRepository.findByTenantIdOrderByTimestampDesc(tenantId);
    }

    public List<Transaction> getStoreTransactions(Long tenantId, Long storeId) {
        return transactionRepository.findByTenantIdAndStoreIdOrderByTimestampDesc(tenantId, storeId);
    }
}
