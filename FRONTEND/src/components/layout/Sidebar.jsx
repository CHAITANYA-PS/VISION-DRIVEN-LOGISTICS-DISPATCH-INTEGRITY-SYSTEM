import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, FileText, Users, Warehouse, 
  BarChart3, ShoppingCart, 
  ClipboardList, AlertCircle, TrendingUp, MapPin, Boxes, CheckSquare, Monitor, PackageSearch, ScanEye, Package2, Truck
} from 'lucide-react';
import { logout, getRole } from '../../services/authService';
import { cn } from '../../utils/helpers';

const menuByRole = {
  ADMIN: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Products', icon: Package, path: '/products' },
    { name: 'SKUs', icon: Boxes, path: '/skus' },
    { name: 'Inventory', icon: Package2, path: '/inventory/stock' },
    { name: 'Shipments', icon: ShoppingCart, path: '/shipments' },
    { name: 'Users', icon: Users, path: '/users' },
    { name: 'Warehouse Layout', icon: Warehouse, path: '/warehouse/zones' },
    { name: 'AI Verification Log', icon: ScanEye, path: '/admin/verification-logs' },
    { name: 'Reports', icon: FileText, path: '/admin/reports' },
  ],
  SUPERVISOR: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/supervisor/dashboard' },
    { name: 'Approvals', icon: CheckSquare, path: '/supervisor/approvals' },
    { name: 'Issues', icon: AlertCircle, path: '/supervisor/issues' },
    { name: 'Shipment Monitoring', icon: ShoppingCart, path: '/supervisor/shipments' },
    { name: 'Worker Monitoring', icon: Monitor, path: '/supervisor/workers' },
    { name: 'Inventory', icon: Package2, path: '/supervisor/stock' },
    { name: 'Reports', icon: FileText, path: '/supervisor/reports' },
  ],
  WORKER: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/worker/dashboard' },
    { name: 'Inbound Shipment', icon: PackageSearch, path: '/worker/inbound' },
    { name: 'Outbound Verification', icon: Truck, path: '/worker/outbound' },
    { name: 'Putaway', icon: MapPin, path: '/worker/putaway' },
    { name: 'Outbound Picking', icon: ShoppingCart, path: '/worker/picking' },
    { name: 'Issue Reporting', icon: AlertCircle, path: '/worker/issues' },
  ],
};

export default function Sidebar() {
  const location = useLocation();
  const role = getRole();
  const menuItems = menuByRole[role] || [];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-gray-900">VISERA</h1>
        <p className="text-gray-500 mt-1 capitalize">{role?.toLowerCase() || 'user'}</p>
      </div>
      <nav className="px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors',
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
