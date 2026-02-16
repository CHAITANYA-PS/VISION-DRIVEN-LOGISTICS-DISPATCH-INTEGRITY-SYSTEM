package com.visera.backend.Service;


import com.visera.backend.DTOs.LoginRequest;
import com.visera.backend.DTOs.LoginResponse;
import com.visera.backend.DTOs.RegisterUserDTO;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    LoginResponse register(RegisterUserDTO request);
}

