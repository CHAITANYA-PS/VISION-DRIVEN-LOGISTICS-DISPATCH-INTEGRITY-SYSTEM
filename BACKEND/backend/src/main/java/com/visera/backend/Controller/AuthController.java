package com.visera.backend.Controller;
import com.visera.backend.DTOs.LoginRequest;
import com.visera.backend.DTOs.RegisterUserDTO;
import com.visera.backend.DTOs.LoginResponse;
import com.visera.backend.Service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterUserDTO request) {
        return ResponseEntity.ok(authService.register(request));
    }
}
