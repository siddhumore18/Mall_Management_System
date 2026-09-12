package com.megamart.dto;

import java.math.BigDecimal;

public class PaymentDTOs {

    public record CreatePaymentOrderRequest(
        BigDecimal amount,
        String currency,
        String receipt,
        String description,
        String customerName,
        String customerEmail,
        String customerPhone,
        String paymentMethod // UPI, CARD, CASH
    ) {}

    public record CreatePaymentOrderResponse(
        String orderId,
        BigDecimal amount,
        String currency,
        String keyId,
        String status,
        long timestamp,
        String signature
    ) {}

    public record VerifyPaymentRequest(
        String orderId,
        String paymentId,
        String signature,
        String paymentMethod,
        BigDecimal amount
    ) {}

    public record VerifyPaymentResponse(
        boolean success,
        String transactionId,
        String orderId,
        String message,
        String timestamp
    ) {}

    public record UpiQrResponse(
        String orderId,
        String upiIntentUrl,
        String upiVpa,
        BigDecimal amount,
        String payeeName,
        String qrBase64,
        long expiresAt
    ) {}

    public record CardPaymentRequest(
        String cardNumber,
        String expiryMonth,
        String expiryYear,
        String cvv,
        String cardHolderName,
        BigDecimal amount,
        String orderId
    ) {}

    public record CardPaymentResponse(
        boolean success,
        String paymentId,
        String authorizationCode,
        String message
    ) {}

    public record CreateStripeIntentRequest(
        BigDecimal amount,
        String currency,
        String receiptEmail,
        String description
    ) {}

    public record CreateStripeIntentResponse(
        String clientSecret,
        String paymentIntentId,
        String publishableKey,
        BigDecimal amount,
        String currency,
        String status
    ) {}

    public record StripeConfirmRequest(
        String paymentIntentId,
        String paymentMethodId
    ) {}

    public record StripeConfirmResponse(
        boolean success,
        String paymentIntentId,
        String message
    ) {}
}
