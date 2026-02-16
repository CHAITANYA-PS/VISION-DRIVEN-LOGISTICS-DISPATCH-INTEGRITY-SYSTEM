package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class RegisterUserDTO {
    private String name;
    private String email;
    private String password;
    private String role;
}
