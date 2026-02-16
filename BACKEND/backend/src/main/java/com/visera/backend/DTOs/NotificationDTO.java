package com.visera.backend.DTOs;

import lombok.Data;

@Data
public class NotificationDTO {
    private long id;
    private long userId;
    private String title;
    private String message;
    private String type;
    private boolean read;
}
