import { Navigate } from "react-router-dom";
import { getRole, isAuthenticated } from "../services/authService";

export default function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getRole();

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard if user doesn't have access
    if (userRole === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (userRole === "SUPERVISOR")
      return <Navigate to="/supervisor/dashboard" replace />;
    if (userRole === "WORKER")
      return <Navigate to="/worker/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
