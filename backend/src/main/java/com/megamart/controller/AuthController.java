package com.megamart.controller;

import com.megamart.dto.*;
import com.megamart.security.UserPrincipal;
import com.megamart.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/pin-login")
    public ResponseEntity<AuthResponse> pinLogin(@RequestBody PinAuthRequest request) {
        return ResponseEntity.ok(authService.pinLogin(request));
    }

    @PostMapping("/register-tenant")
    public ResponseEntity<AuthResponse> registerTenant(@RequestBody TenantRegistrationRequest request) {
        return ResponseEntity.ok(authService.registerTenant(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(new UserDto(principal.getUser()));
    }
}
