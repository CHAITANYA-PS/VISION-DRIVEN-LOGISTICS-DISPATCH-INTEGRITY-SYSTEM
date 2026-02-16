package com.visera.backend.DTOs;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDTO {
    private long id;
    private String name;
    private String email;
    private String role;
    private LocalDateTime createdAt;
}

