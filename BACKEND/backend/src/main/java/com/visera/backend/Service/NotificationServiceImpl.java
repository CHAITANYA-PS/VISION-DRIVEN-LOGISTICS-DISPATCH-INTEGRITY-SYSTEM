package com.visera.backend.Service;

import com.visera.backend.Entity.Notification;
import com.visera.backend.Repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repo;

    public NotificationServiceImpl(NotificationRepository repo) {
        this.repo = repo;
    }

    @Override
    public Notification createNotification(Notification n) {
        return repo.save(n);
    }

    @Override
    public List<Notification> getNotificationsByUser(int userId) {
        return repo.findByUserId((long) userId);
    }

    @Override
    public void markAsRead(int id) {
        repo.findById((long) id).ifPresent(n -> {
            n.setRead(true);
            repo.save(n);
        });
    }

    @Override
    public void deleteNotification(int id) {
        repo.deleteById((long) id);
    }
}

