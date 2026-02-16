import { Bell, Check } from "lucide-react";
import { useEffect, useState } from "react";
import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Loading from "../../components/common/Loading";
import { getUserId } from "../../services/authService";
import {
  getNotificationsByUser,
  markNotificationAsRead,
  deleteNotification,
} from "../../services/notificationService";
import { formatDateTime, formatRelativeTime } from "../../utils/formatters";
import { useNotification } from "../../context/NotificationContext";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { refreshUnreadCount, decrementUnreadCount, decrementUnreadCountBy } = useNotification();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        setError("User not authenticated");
        return;
      }
      const data = await getNotificationsByUser(parseInt(userId));
      setNotifications(data);
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistically decrement count immediately
      decrementUnreadCount();
      // Remove notification from list
      setNotifications(notifications.filter((n) => n.id !== id));
      // Delete notification from database
      await deleteNotification(id);
      // No need to refresh immediately - optimistic update handles UI
      // Periodic sync (every 30s) will keep it accurate
    } catch (err) {
      setError("Failed to delete notification");
      // If error, refresh to get correct count and restore optimistic update
      refreshUnreadCount();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      const unreadCount = unread.length;
      
      // Optimistically decrement count immediately
      decrementUnreadCountBy(unreadCount);
      // Remove all unread notifications from list
      setNotifications(notifications.filter((n) => n.read));
      // Delete all unread notifications from database
      await Promise.all(unread.map((n) => deleteNotification(n.id)));
      // No need to refresh immediately - optimistic update handles UI
      // Periodic sync (every 30s) will keep it accurate
    } catch (err) {
      setError("Failed to delete notifications");
      // If error, refresh to get correct count and restore optimistic update
      refreshUnreadCount();
    }
  };

  if (loading) return <Loading text="Loading notifications..." />;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount > 1 ? "s" : ""
                }`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <Check size={20} className="mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                      <h3 className="font-medium text-gray-900">
                        {notification.title || "Notification"}
                      </h3>
                      {!notification.read && <Badge variant="blue">New</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message || notification.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                      <span>{formatDateTime(notification.createdAt)}</span>
                    </div>
                  </div>
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <Check size={16} className="mr-1" />
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
