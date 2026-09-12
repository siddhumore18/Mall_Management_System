package com.megamart.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AnalyticsResponse {
    private BigDecimal totalSales;
    private BigDecimal todaySales;
    private BigDecimal yesterdaySales;
    private double growthRate;
    private BigDecimal averageOrderValue;
    private long totalTransactions;
    private long totalStores;
    private long totalCustomers;
    private long lowStockCount;
    private long expiringSoonCount;
    private Map<String, BigDecimal> salesByStore;
    private Map<String, BigDecimal> salesByPaymentMethod;
    private List<Map<String, Object>> topProducts;

    public AnalyticsResponse() {}

    public AnalyticsResponse(
            BigDecimal totalSales,
            BigDecimal todaySales,
            BigDecimal yesterdaySales,
            double growthRate,
            BigDecimal averageOrderValue,
            long totalTransactions,
            long totalStores,
            long totalCustomers,
            long lowStockCount,
            long expiringSoonCount,
            Map<String, BigDecimal> salesByStore,
            Map<String, BigDecimal> salesByPaymentMethod,
            List<Map<String, Object>> topProducts) {
        this.totalSales = totalSales;
        this.todaySales = todaySales;
        this.yesterdaySales = yesterdaySales;
        this.growthRate = growthRate;
        this.averageOrderValue = averageOrderValue;
        this.totalTransactions = totalTransactions;
        this.totalStores = totalStores;
        this.totalCustomers = totalCustomers;
        this.lowStockCount = lowStockCount;
        this.expiringSoonCount = expiringSoonCount;
        this.salesByStore = salesByStore;
        this.salesByPaymentMethod = salesByPaymentMethod;
        this.topProducts = topProducts;
    }

    public BigDecimal getTotalSales() { return totalSales; }
    public void setTotalSales(BigDecimal totalSales) { this.totalSales = totalSales; }

    public BigDecimal getTodaySales() { return todaySales; }
    public void setTodaySales(BigDecimal todaySales) { this.todaySales = todaySales; }

    public BigDecimal getYesterdaySales() { return yesterdaySales; }
    public void setYesterdaySales(BigDecimal yesterdaySales) { this.yesterdaySales = yesterdaySales; }

    public double getGrowthRate() { return growthRate; }
    public void setGrowthRate(double growthRate) { this.growthRate = growthRate; }

    public BigDecimal getAverageOrderValue() { return averageOrderValue; }
    public void setAverageOrderValue(BigDecimal averageOrderValue) { this.averageOrderValue = averageOrderValue; }

    public long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }

    public long getTotalStores() { return totalStores; }
    public void setTotalStores(long totalStores) { this.totalStores = totalStores; }

    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }

    public long getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(long lowStockCount) { this.lowStockCount = lowStockCount; }

    public long getExpiringSoonCount() { return expiringSoonCount; }
    public void setExpiringSoonCount(long expiringSoonCount) { this.expiringSoonCount = expiringSoonCount; }

    public Map<String, BigDecimal> getSalesByStore() { return salesByStore; }
    public void setSalesByStore(Map<String, BigDecimal> salesByStore) { this.salesByStore = salesByStore; }

    public Map<String, BigDecimal> getSalesByPaymentMethod() { return salesByPaymentMethod; }
    public void setSalesByPaymentMethod(Map<String, BigDecimal> salesByPaymentMethod) { this.salesByPaymentMethod = salesByPaymentMethod; }

    public List<Map<String, Object>> getTopProducts() { return topProducts; }
    public void setTopProducts(List<Map<String, Object>> topProducts) { this.topProducts = topProducts; }
}
