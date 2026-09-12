package com.megamart.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "max_stores", nullable = false)
    private Integer maxStores;

    @Column(name = "max_users", nullable = false)
    private Integer maxUsers;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    public SubscriptionPlan() {}

    public SubscriptionPlan(String name, Integer maxStores, Integer maxUsers, BigDecimal price) {
        this.name = name;
        this.maxStores = maxStores;
        this.maxUsers = maxUsers;
        this.price = price;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getMaxStores() { return maxStores; }
    public void setMaxStores(Integer maxStores) { this.maxStores = maxStores; }

    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
