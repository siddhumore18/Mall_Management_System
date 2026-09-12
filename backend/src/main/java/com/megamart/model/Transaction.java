package com.megamart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_trx_tenant_store", columnList = "tenant_id, store_id"),
    @Index(name = "idx_trx_tenant_timestamp", columnList = "tenant_id, timestamp"),
    @Index(name = "idx_trx_customer", columnList = "customer_id")
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "cashier_id", nullable = false)
    private Long cashierId;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod = "CASH";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type = TransactionType.SALE;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TransactionLineItem> lineItems = new ArrayList<>();

    public Transaction() {}

    public Transaction(Long tenantId, Long storeId, Long cashierId, Long customerId, BigDecimal totalAmount, BigDecimal taxAmount, BigDecimal discountAmount, String paymentMethod, TransactionType type) {
        this.tenantId = tenantId;
        this.storeId = storeId;
        this.cashierId = cashierId;
        this.customerId = customerId;
        this.totalAmount = totalAmount;
        this.taxAmount = taxAmount;
        this.discountAmount = discountAmount;
        this.paymentMethod = paymentMethod;
        this.type = type;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public Long getCashierId() { return cashierId; }
    public void setCashierId(Long cashierId) { this.cashierId = cashierId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public List<TransactionLineItem> getLineItems() { return lineItems; }
    public void setLineItems(List<TransactionLineItem> lineItems) { this.lineItems = lineItems; }

    public void addLineItem(TransactionLineItem item) {
        item.setTransaction(this);
        this.lineItems.add(item);
    }
}
