package com.megamart.service;

import com.megamart.dto.AnalyticsResponse;
import com.megamart.model.Store;
import com.megamart.model.Transaction;
import com.megamart.model.TransactionLineItem;
import com.megamart.repository.CustomerRepository;
import com.megamart.repository.StoreInventoryRepository;
import com.megamart.repository.StoreRepository;
import com.megamart.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private StoreInventoryRepository storeInventoryRepository;

    public AnalyticsResponse getTenantAnalytics(Long tenantId) {
        BigDecimal totalSales = transactionRepository.sumTotalSalesByTenant(tenantId);
        if (totalSales == null) totalSales = BigDecimal.ZERO;

        List<Transaction> transactions = transactionRepository.findByTenantIdOrderByTimestampDesc(tenantId);
        long totalTransactions = transactions.size();
        long totalStores = storeRepository.countByTenantId(tenantId);
        long totalCustomers = customerRepository.countByTenantId(tenantId);
        long lowStockCount = storeInventoryRepository.countLowStockByTenantId(tenantId, 20);
        long expiringSoonCount = storeInventoryRepository.countExpiringSoonByTenantId(tenantId, LocalDate.now().plusDays(7));

        // Today vs Yesterday Sales
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        BigDecimal todaySales = BigDecimal.ZERO;
        BigDecimal yesterdaySales = BigDecimal.ZERO;
        Map<String, BigDecimal> salesByPaymentMethod = new LinkedHashMap<>();

        // Initialize default payment methods
        salesByPaymentMethod.put("UPI", BigDecimal.ZERO);
        salesByPaymentMethod.put("CARD", BigDecimal.ZERO);
        salesByPaymentMethod.put("RAZORPAY", BigDecimal.ZERO);
        salesByPaymentMethod.put("STRIPE", BigDecimal.ZERO);
        salesByPaymentMethod.put("CASH", BigDecimal.ZERO);
        salesByPaymentMethod.put("GIFT", BigDecimal.ZERO);

        Map<String, Integer> productQtyMap = new HashMap<>();
        Map<String, BigDecimal> productRevMap = new HashMap<>();

        for (Transaction trx : transactions) {
            LocalDate trxDate = trx.getTimestamp().atZone(ZoneId.systemDefault()).toLocalDate();
            if (trxDate.isEqual(today)) {
                todaySales = todaySales.add(trx.getTotalAmount());
            } else if (trxDate.isEqual(yesterday)) {
                yesterdaySales = yesterdaySales.add(trx.getTotalAmount());
            }

            // Payment method breakdown
            String method = trx.getPaymentMethod() != null ? trx.getPaymentMethod().toUpperCase() : "CASH";
            String category = "CASH";
            if (method.contains("UPI")) category = "UPI";
            else if (method.contains("RAZORPAY")) category = "RAZORPAY";
            else if (method.contains("STRIPE")) category = "STRIPE";
            else if (method.contains("CARD") || method.contains("VISA") || method.contains("MASTER")) category = "CARD";
            else if (method.contains("GIFT") || method.contains("VOUCHER")) category = "GIFT";

            salesByPaymentMethod.put(category, salesByPaymentMethod.getOrDefault(category, BigDecimal.ZERO).add(trx.getTotalAmount()));

            // Product aggregation
            if (trx.getLineItems() != null) {
                for (TransactionLineItem item : trx.getLineItems()) {
                    String prodName = item.getProduct() != null ? item.getProduct().getName() : "Item #" + item.getId();
                    productQtyMap.put(prodName, productQtyMap.getOrDefault(prodName, 0) + item.getQuantity());
                    productRevMap.put(prodName, productRevMap.getOrDefault(prodName, BigDecimal.ZERO).add(item.getSubtotal()));
                }
            }
        }

        // Growth rate calculation
        double growthRate = 0.0;
        if (yesterdaySales.compareTo(BigDecimal.ZERO) > 0) {
            growthRate = todaySales.subtract(yesterdaySales)
                    .divide(yesterdaySales, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        } else if (todaySales.compareTo(BigDecimal.ZERO) > 0) {
            growthRate = 100.0;
        }

        // Average Order Value (AOV)
        BigDecimal averageOrderValue = totalTransactions > 0
                ? totalSales.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Sales by store
        List<Store> stores = storeRepository.findByTenantId(tenantId);
        Map<String, BigDecimal> salesByStore = new HashMap<>();
        for (Store store : stores) {
            BigDecimal storeSales = transactionRepository.sumTotalSalesByStore(tenantId, store.getId());
            salesByStore.put(store.getName(), storeSales != null ? storeSales : BigDecimal.ZERO);
        }

        // Top 5 products
        List<Map<String, Object>> topProducts = productQtyMap.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(entry -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("name", entry.getKey());
                    map.put("quantitySold", entry.getValue());
                    map.put("revenue", productRevMap.getOrDefault(entry.getKey(), BigDecimal.ZERO));
                    return map;
                })
                .collect(Collectors.toList());

        return new AnalyticsResponse(
                totalSales,
                todaySales,
                yesterdaySales,
                growthRate,
                averageOrderValue,
                totalTransactions,
                totalStores,
                totalCustomers,
                lowStockCount,
                expiringSoonCount,
                salesByStore,
                salesByPaymentMethod,
                topProducts
        );
    }
}
