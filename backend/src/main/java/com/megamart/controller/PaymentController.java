package com.megamart.controller;

import com.megamart.dto.PaymentDTOs.*;
import com.megamart.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping({"/api/payments", "/api/v1/payments"})
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<CreatePaymentOrderResponse> createOrder(@RequestBody CreatePaymentOrderRequest request) {
        CreatePaymentOrderResponse response = paymentService.createPaymentOrder(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<VerifyPaymentResponse> verifyPayment(@RequestBody VerifyPaymentRequest request) {
        VerifyPaymentResponse response = paymentService.verifyPayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stripe/create-intent")
    public ResponseEntity<CreateStripeIntentResponse> createStripeIntent(@RequestBody CreateStripeIntentRequest request) {
        CreateStripeIntentResponse response = paymentService.createStripePaymentIntent(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stripe/confirm")
    public ResponseEntity<StripeConfirmResponse> confirmStripe(@RequestBody StripeConfirmRequest request) {
        StripeConfirmResponse response = paymentService.confirmStripePayment(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/upi-qr")
    public ResponseEntity<UpiQrResponse> getUpiQr(
            @RequestParam(defaultValue = "order_default") String orderId,
            @RequestParam(defaultValue = "100.00") BigDecimal amount,
            @RequestParam(defaultValue = "MegaMart Retail") String payeeName) {
        UpiQrResponse response = paymentService.generateUpiQr(orderId, amount, payeeName);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/process-card")
    public ResponseEntity<CardPaymentResponse> processCard(@RequestBody CardPaymentRequest request) {
        CardPaymentResponse response = paymentService.processCardPayment(request);
        return ResponseEntity.ok(response);
    }
}
