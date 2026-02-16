package com.visera.backend.Service;

import com.visera.backend.Entity.Notification;

import java.util.List;

public interface NotificationService {
    Notification createNotification(Notification n);
    List<Notification> getNotificationsByUser(int userId);
    void markAsRead(int id);
    void deleteNotification(int id);
}

