package com.megamart.controller;

import com.megamart.service.AiAssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Spring AI REST Controller for MegaMart ProERP
 * Exposes endpoints for:
 * 1. POST /api/v1/ai/copilot - Natural language retail Q&A assistant
 * 2. POST /api/v1/ai/demand-forecast - Automated AI stock reorder suggestions
 * 3. POST /api/v1/ai/audit-risk - Loss prevention fraud analysis
 * 4. POST /api/v1/ai/customer-insights - CRM loyalty promotions & drafts
 */
@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Autowired
    private AiAssistantService aiAssistantService;

    @PostMapping("/copilot")
    public ResponseEntity<Map<String, Object>> getCopilotResponse(@RequestBody Map<String, Object> req) {
        String query = (String) req.getOrDefault("query", "Hello");
        String role = (String) req.getOrDefault("role", "STORE_MANAGER");
        String storeName = (String) req.getOrDefault("storeName", "MegaMart Flagship Mumbai");

        Map<String, Object> response = aiAssistantService.generateCopilotResponse(query, role, storeName);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/demand-forecast")
    public ResponseEntity<Map<String, Object>> getDemandForecast(@RequestBody Map<String, Object> req) {
        String storeName = (String) req.getOrDefault("storeName", "MegaMart Flagship Mumbai");
        List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("lowStockItems");

        Map<String, Object> response = aiAssistantService.generateDemandForecast(storeName, items);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/audit-risk")
    public ResponseEntity<Map<String, Object>> getFraudAuditRisk(@RequestBody Map<String, Object> req) {
        List<Map<String, Object>> incidents = (List<Map<String, Object>>) req.get("incidents");

        Map<String, Object> response = aiAssistantService.performFraudAuditRiskAnalysis(incidents);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/customer-insights")
    public ResponseEntity<Map<String, Object>> getCustomerInsights(@RequestBody Map<String, Object> req) {
        String customerName = (String) req.getOrDefault("customerName", "Rohan Sharma");
        double totalSpent = req.get("totalSpent") != null ? Double.parseDouble(req.get("totalSpent").toString()) : 15000.0;
        String tier = (String) req.getOrDefault("tier", "GOLD");

        Map<String, Object> response = aiAssistantService.generateCustomerLoyaltyInsights(customerName, totalSpent, tier);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/expiry-risk")
    public ResponseEntity<Map<String, Object>> getExpiryRisk(@RequestBody Map<String, Object> req) {
        String storeName = (String) req.getOrDefault("storeName", "MegaMart Flagship Mumbai");
        List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("expiryItems");

        Map<String, Object> response = aiAssistantService.performExpiryRiskAnalysis(storeName, items);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/parse-gs1-barcode")
    public ResponseEntity<Map<String, Object>> parseGs1Barcode(@RequestBody Map<String, Object> req) {
        String barcode = (String) req.getOrDefault("barcode", "8901234567890");
        Map<String, Object> response = aiAssistantService.parseGs1Barcode(barcode);
        return ResponseEntity.ok(response);
    }
}
