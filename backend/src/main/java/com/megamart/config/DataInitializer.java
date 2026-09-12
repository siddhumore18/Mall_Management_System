package com.megamart.config;

import com.megamart.model.*;
import com.megamart.repository.*;
import com.megamart.service.TransactionService;
import com.megamart.dto.TransactionRequest;
import com.megamart.dto.CartItemRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductMasterRepository productRepository;

    @Autowired
    private StoreInventoryRepository inventoryRepository;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.seed.sample-data:false}")
    private boolean seedSampleData;

    @Override
    public void run(String... args) throws Exception {
        // 1. Always Ensure Fundamental Subscription Plans Exist
        if (planRepository.count() == 0) {
            planRepository.save(new SubscriptionPlan("Starter Boutique", 2, 10, new BigDecimal("4999.00")));
            planRepository.save(new SubscriptionPlan("Standard Chain", 10, 50, new BigDecimal("14999.00")));
            planRepository.save(new SubscriptionPlan("Enterprise Hyper-Scale", 50, 500, new BigDecimal("39999.00")));
        }

        // 2. Always Ensure Super Admin Exists with correct secure password
        String secureAdminPass = passwordEncoder.encode("SuperAdmin@2026!");
        var existingAdmin = userRepository.findByEmail("superadmin@megamart.com");
        if (existingAdmin.isEmpty()) {
            userRepository.save(new User(null, null, "MegaMart SaaS Master", "superadmin@megamart.com", secureAdminPass, "9999", Role.SUPER_ADMIN));
        } else {
            // Update password to the secure version in case it was set from old sample data
            User admin = existingAdmin.get();
            if (!passwordEncoder.matches("SuperAdmin@2026!", admin.getPasswordHash())) {
                admin.setPasswordHash(secureAdminPass);
                admin.setName("MegaMart SaaS Master");
                admin.setPinCode("9999");
                userRepository.save(admin);
            }
        }

        // In Production Mode (seedSampleData == false), do NOT seed any dummy stores, products, or transactions!
        if (!seedSampleData) {
            return;
        }

        if (tenantRepository.count() > 0) return;

        SubscriptionPlan planEnterprise = planRepository.findAll().stream()
                .filter(p -> p.getName().contains("Enterprise"))
                .findFirst().orElse(null);
        SubscriptionPlan planStandard = planRepository.findAll().stream()
                .filter(p -> p.getName().contains("Standard"))
                .findFirst().orElse(null);

        // 2. Tenants
        Tenant tenant1 = tenantRepository.save(new Tenant("MegaMart Retail India Ltd", planEnterprise, TenantStatus.ACTIVE));
        Tenant tenant2 = tenantRepository.save(new Tenant("Apex Superstores Bharat", planStandard, TenantStatus.ACTIVE));


        // 3. Stores in Indian Metropolitan Hubs
        Store store1 = storeRepository.save(new Store(tenant1.getId(), "MegaMart Flagship Store", "Bandra West, Mumbai", "ST-101"));
        Store store2 = storeRepository.save(new Store(tenant1.getId(), "MegaMart Hypermarket", "Indiranagar, Bengaluru", "ST-102"));
        Store store3 = storeRepository.save(new Store(tenant2.getId(), "Apex Metro Express", "Connaught Place, New Delhi", "ST-201"));

        // 4. Users across all 7 RBAC roles
        String pass = passwordEncoder.encode("password123");

        // Super Admin is already created above, skip re-creation here

        // Tenant Admin (Mall/Chain owner)
        User tenantAdmin = userRepository.save(new User(tenant1.getId(), null, "Rajesh Sharma (HQ Admin)", "admin@megamart.com", pass, "1234", Role.TENANT_ADMIN));

        // Accountant
        userRepository.save(new User(tenant1.getId(), null, "Ananya Verma (CFO)", "accountant@megamart.com", pass, "1234", Role.ACCOUNTANT));

        // Store Manager
        userRepository.save(new User(tenant1.getId(), store1.getId(), "Vikram Malhotra (Store Manager)", "manager@megamart.com", pass, "1234", Role.STORE_MANAGER));

        // Cashier
        User cashier = userRepository.save(new User(tenant1.getId(), store1.getId(), "Priya Patel (Lead Cashier)", "cashier@megamart.com", pass, "1234", Role.CASHIER));

        // Customer Service
        userRepository.save(new User(tenant1.getId(), store1.getId(), "Neha Gupta (Service Desk)", "cs@megamart.com", pass, "1234", Role.CUSTOMER_SERVICE));

        // Inventory Clerk
        userRepository.save(new User(tenant1.getId(), store1.getId(), "Suresh Kumar (FEFO Auditor)", "clerk@megamart.com", pass, "1234", Role.INVENTORY_CLERK));

        // 5. Products Catalog with Real Thumbnail Images & INR (₹) Pricing
        ProductMaster p1 = productRepository.save(new ProductMaster(
            tenant1.getId(), "8901234567890", "Amul Taaza Milk 1L", 
            new BigDecimal("68.00"), new BigDecimal("55.00"), "Dairy & Cold Storage", "carton",
            "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=80"
        ));
        
        ProductMaster p2 = productRepository.save(new ProductMaster(
            tenant1.getId(), "8901234567891", "Britannia Sourdough Bread 500g", 
            new BigDecimal("110.00"), new BigDecimal("80.00"), "Bakery & Breads", "loaf",
            "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=150&auto=format&fit=crop&q=80"
        ));

        ProductMaster p3 = productRepository.save(new ProductMaster(
            tenant1.getId(), "8901234567892", "Blue Tokai Coffee Beans 1kg", 
            new BigDecimal("850.00"), new BigDecimal("620.00"), "Beverages & Pantry", "bag",
            "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=150&auto=format&fit=crop&q=80"
        ));

        ProductMaster p4 = productRepository.save(new ProductMaster(
            tenant1.getId(), "8901234567893", "Himalayan Mineral Water 6x500ml", 
            new BigDecimal("180.00"), new BigDecimal("120.00"), "Beverages & Pantry", "pack",
            "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150&auto=format&fit=crop&q=80"
        ));

        ProductMaster p5 = productRepository.save(new ProductMaster(
            tenant1.getId(), "8901234567894", "Figaro Cold Pressed Olive Oil 750ml", 
            new BigDecimal("750.00"), new BigDecimal("540.00"), "Beverages & Pantry", "bottle",
            "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80"
        ));

        ProductMaster p6 = productRepository.save(new ProductMaster(
            tenant1.getId(), "8901234567895", "Epigamia Greek Yogurt 500g", 
            new BigDecimal("95.00"), new BigDecimal("68.00"), "Dairy & Cold Storage", "tub",
            "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&auto=format&fit=crop&q=80"
        ));

        // 6. Store Inventories with FEFO batch dates
        inventoryRepository.save(new StoreInventory(tenant1.getId(), store1.getId(), p1, 85, "BATCH-M24", LocalDate.now().plusDays(4)));
        inventoryRepository.save(new StoreInventory(tenant1.getId(), store1.getId(), p2, 40, "BATCH-B11", LocalDate.now().plusDays(2)));
        inventoryRepository.save(new StoreInventory(tenant1.getId(), store1.getId(), p3, 120, "BATCH-C90", LocalDate.now().plusDays(180)));
        inventoryRepository.save(new StoreInventory(tenant1.getId(), store1.getId(), p4, 15, "BATCH-W05", LocalDate.now().plusDays(90)));
        inventoryRepository.save(new StoreInventory(tenant1.getId(), store1.getId(), p5, 65, "BATCH-O88", LocalDate.now().plusDays(240)));
        inventoryRepository.save(new StoreInventory(tenant1.getId(), store1.getId(), p6, 12, "BATCH-Y33", LocalDate.now().plusDays(1)));

        // Store 2 Inventories
        inventoryRepository.save(new StoreInventory(tenant1.getId(), store2.getId(), p1, 110, "BATCH-M24", LocalDate.now().plusDays(5)));
        inventoryRepository.save(new StoreInventory(tenant1.getId(), store2.getId(), p3, 90, "BATCH-C90", LocalDate.now().plusDays(180)));

        // 7. Customers in India
        Customer c1 = customerRepository.save(new Customer(tenant1.getId(), "+91 9876543210", "Aarav Sharma"));
        Customer c2 = customerRepository.save(new Customer(tenant1.getId(), "+91 9123456789", "Pooja Reddy"));

        // 8. Seed Transactions (INR ₹)
        TransactionRequest trx1 = new TransactionRequest();
        trx1.setStoreId(store1.getId());
        trx1.setCustomerId(c1.getId());
        trx1.setPaymentMethod("UPI");
        trx1.setTaxAmount(new BigDecimal("49.30"));
        trx1.setDiscountAmount(BigDecimal.ZERO);
        trx1.setLineItems(List.of(
                new CartItemRequest(p1.getId(), 2),
                new CartItemRequest(p3.getId(), 1)
        ));
        transactionService.processTransaction(tenant1.getId(), cashier.getId(), trx1);
    }
}
