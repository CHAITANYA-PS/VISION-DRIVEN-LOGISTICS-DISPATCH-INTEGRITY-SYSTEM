import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectWebSocket, disconnectWebSocket } from '../services/websocketService';
import { getNotificationsByUser } from '../services/notificationService';
import { getUserId, getRole, isAuthenticated } from '../services/authService';

const NotificationContext = createContext(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children, addToast }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated()) return;

    try {
      const userId = getUserId();
      if (!userId) return;

      const notifications = await getNotificationsByUser(parseInt(userId));
      // DTO uses 'read' field (boolean)
      const unread = notifications.filter((n) => !n.read);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, []);

  useEffect(() => {
    // Only connect for supervisors and workers
    const role = getRole();
    if ((role !== 'SUPERVISOR' && role !== 'WORKER') || !isAuthenticated()) {
      return;
    }

    // Fetch initial unread count
    fetchUnreadCount();

    // Set up periodic sync (every 30 seconds)
    const syncInterval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    // Get userId for WebSocket connection and message handling
    const userId = getUserId();
    
    const handleWebSocketMessage = (notification) => {
      // For workers, filter notifications by workerId
      if (role === 'WORKER' && notification.workerId) {
        const currentUserId = parseInt(userId);
        // Handle both number and string types from JSON
        const notificationWorkerId = typeof notification.workerId === 'number' 
          ? notification.workerId 
          : parseInt(notification.workerId);
        if (notificationWorkerId !== currentUserId) {
          // This notification is not for this worker, ignore it
          return;
        }
      }

      // Map backend notification type to frontend toast type
      const toastTypeMap = {
        ALERT: 'warning',
        WARNING: 'error',
        INFO: 'info',
        ERROR: 'error',
      };

      const toastType = toastTypeMap[notification.type] || 'info';

      // Show toast notification
      if (addToast) {
        addToast({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: toastType,
          link: notification.link,
        });
      }

      // Increment unread count
      setUnreadCount((prev) => prev + 1);
    };

    const handleWebSocketError = (error) => {
      console.error('WebSocket error:', error);
    };

    // Connect to WebSocket (async)
    connectWebSocket(handleWebSocketMessage, handleWebSocketError, role, userId).catch((error) => {
      console.error('Failed to connect WebSocket:', error);
    });

    // Cleanup
    return () => {
      clearInterval(syncInterval);
      disconnectWebSocket();
    };
  }, [addToast, fetchUnreadCount]);

  const refreshUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const decrementUnreadCountBy = useCallback((count) => {
    setUnreadCount((prev) => Math.max(0, prev - count));
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, decrementUnreadCount, decrementUnreadCountBy }}>
      {children}
    </NotificationContext.Provider>
  );
}
