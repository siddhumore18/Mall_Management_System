package com.megamart.controller;

import com.megamart.dto.AnalyticsResponse;
import com.megamart.security.UserPrincipal;
import com.megamart.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/tenant")
    public ResponseEntity<AnalyticsResponse> getTenantAnalytics(@AuthenticationPrincipal UserPrincipal principal) {
        Long tenantId = principal.getTenantId();
        return ResponseEntity.ok(analyticsService.getTenantAnalytics(tenantId));
    }
}
