import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { getRole, isAuthenticated } from "../services/authService";
import ProtectedRoute from "./ProtectedRoute";

// Auth pages
import Login from "../pages/auth/Login";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminReports from "../pages/admin/Reports";
import VerificationLogs from "../pages/admin/VerificationLogs";

// Supervisor pages
import Approvals from "../pages/supervisor/Approvals";
import SupervisorIssues from "../pages/supervisor/Issues";
import SupervisorReports from "../pages/supervisor/Reports";
import SupervisorDashboard from "../pages/supervisor/SupervisorDashboard";
import SupervisorShipments from "../pages/supervisor/SupervisorShipments";
import Workers from "../pages/supervisor/Workers";

// Worker pages
import Inbound from "../pages/worker/Inbound";
import Issues from "../pages/worker/Issues";
import Outbound from "../pages/worker/Outbound";
import Picking from "../pages/worker/Picking";
import Putaway from "../pages/worker/Putaway";
import WorkerTasks from "../pages/worker/Tasks";
import WorkerDashboard from "../pages/worker/WorkerDashboard";

// Shared pages
import InventoryManagement from "../pages/inventory/InventoryManagement";
import InventoryStock from "../pages/inventory/InventoryStock";
import StockDetail from "../pages/inventory/StockDetail";
import Notifications from "../pages/notifications/Notifications";
import ProductCreate from "../pages/products/ProductCreate";
import ProductDetail from "../pages/products/ProductDetail";
import ProductEdit from "../pages/products/ProductEdit";
import ProductList from "../pages/products/ProductList";
import Settings from "../pages/settings/Settings";
import ShipmentCreate from "../pages/shipments/ShipmentCreate";
import ShipmentDetail from "../pages/shipments/ShipmentDetail";
import ShipmentEdit from "../pages/shipments/ShipmentEdit";
import ShipmentList from "../pages/shipments/ShipmentList";
import SkuCreate from "../pages/skus/SkuCreate";
import SkuDetail from "../pages/skus/SkuDetail";
import SkuEdit from "../pages/skus/SkuEdit";
import SkuList from "../pages/skus/SkuList";
import TaskList from "../pages/tasks/TaskList";
import UserManagement from "../pages/users/UserManagement";
import Bins from "../pages/warehouse/Bins";
import Racks from "../pages/warehouse/Racks";
import Zones from "../pages/warehouse/Zones";

function DefaultRedirect() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getRole();
  if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  if (role === "SUPERVISOR")
    return <Navigate to="/supervisor/dashboard" replace />;
  if (role === "WORKER") return <Navigate to="/worker/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Default redirect */}
        <Route path="/" element={<DefaultRedirect />} />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/verification-logs"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout>
                <VerificationLogs />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout>
                <AdminReports />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Supervisor routes */}
        <Route
          path="/supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
              <Layout>
                <SupervisorDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/approvals"
          element={
            <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
              <Layout>
                <Approvals />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/shipments"
          element={
            <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
              <Layout>
                <SupervisorShipments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/workers"
          element={
            <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
              <Layout>
                <Workers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/stock"
          element={
            <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
              <Layout>
                <InventoryManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/reports"
          element={
            <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
              <Layout>
                <SupervisorReports />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/issues"
          element={
            <ProtectedRoute allowedRoles={["SUPERVISOR"]}>
              <Layout>
                <SupervisorIssues />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Worker routes */}
        <Route
          path="/worker/dashboard"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <Layout>
                <WorkerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/tasks"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <Layout>
                <WorkerTasks />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/inbound"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <Layout>
                <Inbound />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/outbound"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <Layout>
                <Outbound />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/putaway"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <Layout>
                <Putaway />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/picking"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <Layout>
                <Picking />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/issues"
          element={
            <ProtectedRoute allowedRoles={["WORKER"]}>
              <Layout>
                <Issues />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Shared routes - accessible by all authenticated users */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <ProductList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/create"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <ProductCreate />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR"]}>
              <Layout>
                <ProductEdit />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <ProductDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skus"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <SkuList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skus/create"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <SkuCreate />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skus/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <SkuEdit />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skus/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <SkuDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <ShipmentList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments/create"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <ShipmentCreate />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR"]}>
              <Layout>
                <ShipmentEdit />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <ShipmentDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/warehouse/zones"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <Zones />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/warehouse/racks"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <Racks />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/warehouse/bins"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <Bins />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/stock"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <InventoryManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/search"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <InventoryStock />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/view/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <StockDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <TaskList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERVISOR", "WORKER"]}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to default */}
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
