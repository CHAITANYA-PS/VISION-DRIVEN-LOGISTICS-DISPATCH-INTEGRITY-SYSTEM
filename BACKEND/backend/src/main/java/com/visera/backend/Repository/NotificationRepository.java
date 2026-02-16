package com.visera.backend.Repository;
import com.visera.backend.Entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);
//
//    List<Notification> findByType(String type);
//
//    List<Notification> findByIsRead(boolean isRead);
}
