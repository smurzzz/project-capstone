import { useState } from "react";
import {
  Building2,
  Calendar,
  ChartNoAxesCombined,
  Home,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Settings,
  ShoppingCart,
  UsersRound,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <Home className="h-5 w-5" />, isParent: true },
  { name: "Orders", path: "/admin/orders", icon: <ShoppingCart className="h-5 w-5" /> },
  { name: "Appointments", path: "/admin/appointments", icon: <Calendar className="h-5 w-5" /> },
  { name: "Inventory", path: "/admin/inventory", icon: <Package className="h-5 w-5" /> },
  { name: "Package Deals", path: "/admin/packages", icon: <PackagePlus className="h-5 w-5" /> },
  { name: "Staff", path: "/admin/staff", icon: <UsersRound className="h-5 w-5" /> },
  { name: "Reports", path: "/admin/reports", icon: <ChartNoAxesCombined className="h-5 w-5" /> },
  { name: "Settings", path: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static h-screen`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="font-bold text-lg">JBM ELECTRO</h1>
                <p className="text-xs text-gray-400">VENTURES</p>
              </div>
            </div>

            <button onClick={() => setIsOpen(false)} className="lg:hidden" type="button">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map(({ name, path, icon, isParent }) => (
              <NavLink
                key={name}
                to={path}
                end={isParent}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                {icon}
                <span>{name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm">{user?.name?.[0]?.toUpperCase() || "A"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user?.name || "Admin User"}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || "admin@jbm.com"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
              type="button"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <button
        onClick={() => setIsOpen(true)}
        className="p-3 m-3 bg-gray-900 text-white rounded-lg lg:hidden"
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
};

export default Sidebar;
