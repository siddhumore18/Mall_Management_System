package com.megamart;

import com.megamart.dto.CreateProductRequest;
import com.megamart.dto.PaymentDTOs.*;
import com.megamart.dto.ProductDto;
import com.megamart.dto.AnalyticsResponse;
import com.megamart.model.*;
import com.megamart.repository.*;
import com.megamart.service.AnalyticsService;
import com.megamart.service.PaymentService;
import com.megamart.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ProductionBusinessLogicTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ProductService productService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testRazorpayPaymentOrderAndVerification() {
        CreatePaymentOrderRequest orderReq = new CreatePaymentOrderRequest(
                new BigDecimal("499.00"),
                "INR",
                "RCP_TEST_1001",
                "Test POS Transaction",
                "Rahul Sharma",
                "rahul@test.com",
                "9876543210",
                "UPI"
        );

        CreatePaymentOrderResponse orderRes = paymentService.createPaymentOrder(orderReq);
        assertNotNull(orderRes);
        assertNotNull(orderRes.orderId());
        assertEquals(new BigDecimal("499.00"), orderRes.amount());
        assertNotNull(orderRes.signature());

        // Verify Payment
        VerifyPaymentRequest verifyReq = new VerifyPaymentRequest(
                orderRes.orderId(),
                "pay_test_" + System.currentTimeMillis(),
                orderRes.signature(),
                "UPI",
                new BigDecimal("499.00")
        );

        VerifyPaymentResponse verifyRes = paymentService.verifyPayment(verifyReq);
        assertNotNull(verifyRes);
        assertTrue(verifyRes.success());
        assertEquals(orderRes.orderId(), verifyRes.orderId());
    }

    @Test
    public void testStripePaymentIntentAndConfirmation() {
        CreateStripeIntentRequest stripeReq = new CreateStripeIntentRequest(
                new BigDecimal("1200.00"),
                "INR",
                "customer@example.com",
                "POS Card Checkout"
        );

        CreateStripeIntentResponse intentRes = paymentService.createStripePaymentIntent(stripeReq);
        assertNotNull(intentRes);
        assertNotNull(intentRes.clientSecret());
        assertNotNull(intentRes.paymentIntentId());
        assertNotNull(intentRes.publishableKey());
        assertEquals("requires_payment_method", intentRes.status());

        // Confirm
        StripeConfirmResponse confirmRes = paymentService.confirmStripePayment(
                new StripeConfirmRequest(intentRes.paymentIntentId(), "pm_card_visa")
        );
        assertNotNull(confirmRes);
        assertTrue(confirmRes.success());
    }

    @Test
    @Transactional
    public void testProductOnboardingAndInventoryLinkage() {
        Tenant tenant = tenantRepository.findAll().stream().findFirst().orElse(null);
        if (tenant == null) {
            SubscriptionPlan plan = planRepository.save(new SubscriptionPlan("Test Plan", 5, 20, new BigDecimal("4999.00")));
            tenant = tenantRepository.save(new Tenant("Test Enterprise", plan, TenantStatus.ACTIVE));
        }

        Store store = storeRepository.save(new Store(tenant.getId(), "Test Outlet", "City Center", "ST-999"));

        String uniqueBarcode = "9900" + System.currentTimeMillis() % 100000000;
        CreateProductRequest req = new CreateProductRequest();
        req.setBarcode(uniqueBarcode);
        req.setName("Organic Arabica Coffee 250g");
        req.setCategory("Beverages & Pantry");
        req.setGlobalPrice(new BigDecimal("350.00"));
        req.setCostPrice(new BigDecimal("220.00"));
        req.setUnit("pack");
        req.setStoreId(store.getId());
        req.setInitialStock(45);
        req.setBatchNumber("BATCH-TST-01");
        req.setExpiryDate(LocalDate.now().plusMonths(6));

        final Long finalTenantId = tenant.getId();
        ProductDto created = productService.createProduct(finalTenantId, req);
        assertNotNull(created);
        assertEquals(uniqueBarcode, created.getBarcode());
        assertEquals("Organic Arabica Coffee 250g", created.getName());
        assertEquals(45, created.getStockQuantity());

        // Test duplicate barcode rejection
        assertThrows(RuntimeException.class, () -> {
            productService.createProduct(finalTenantId, req);
        }, "Should reject creating a product with duplicate barcode for same tenant");
    }

    @Test
    public void testAnalyticsCalculations() {
        Tenant tenant = tenantRepository.findAll().stream().findFirst().orElse(null);
        if (tenant != null) {
            AnalyticsResponse analytics = analyticsService.getTenantAnalytics(tenant.getId());
            assertNotNull(analytics);
            assertNotNull(analytics.getTotalSales());
            assertNotNull(analytics.getTodaySales());
            assertNotNull(analytics.getSalesByPaymentMethod());
            assertNotNull(analytics.getSalesByStore());
            assertTrue(analytics.getSalesByPaymentMethod().containsKey("UPI"));
            assertTrue(analytics.getSalesByPaymentMethod().containsKey("CARD"));
            assertTrue(analytics.getSalesByPaymentMethod().containsKey("CASH"));
        }
    }
}
