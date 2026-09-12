package com.megamart.controller;

import com.megamart.dto.TransactionRequest;
import com.megamart.model.Transaction;
import com.megamart.security.UserPrincipal;
import com.megamart.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(
            @RequestBody TransactionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        Long cashierId = principal.getUser().getId();
        return ResponseEntity.ok(transactionService.processTransaction(tenantId, cashierId, request));
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getTenantTransactions(@AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(transactionService.getTenantTransactions(tenantId));
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<Transaction>> getStoreTransactions(
            @PathVariable Long storeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(transactionService.getStoreTransactions(tenantId, storeId));
    }
}
