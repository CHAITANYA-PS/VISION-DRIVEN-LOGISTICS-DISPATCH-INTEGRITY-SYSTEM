import { Bell, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRole, getUserId, logout } from "../../services/authService";
import { formatRole } from "../../utils/formatters";
import Button from "../common/Button";
import Badge from "../common/Badge";
import { useNotification } from "../../context/NotificationContext";

export default function Header() {
  const navigate = useNavigate();
  const role = getRole();
  const userId = getUserId();
  const { unreadCount } = useNotification();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user name - you can update this to get from user context/service
  const getUserName = () => {
    const roleMap = {
      ADMIN: 'Admin User',
      SUPERVISOR: 'Supervisor',
      WORKER: 'Worker',
    };
    return roleMap[role] || `User #${userId}`;
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Empty space - removed search bar */}
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/notifications")}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
          <User className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">{getUserName()}</span>
        </div>
        
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
