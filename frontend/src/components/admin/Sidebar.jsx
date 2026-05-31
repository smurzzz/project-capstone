import { useState } from "react";
import {
  Building2,
  Calendar,
  BarChart3,
  Home,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Settings,
  ShoppingCart,
  UsersRound,
  X,
  Zap,
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
  { name: "Reports", path: "/admin/reports", icon: <BarChart3 className="h-5 w-5" /> },
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
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static h-screen flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-1.5">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base">JBM ELECTRO</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white" type="button">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(({ name, path, icon, isParent }) => (
            <NavLink
              key={name}
              to={path}
              end={isParent}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`
              }
            >
              {icon}
              <span className="text-sm font-medium">{name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-white">{user?.name?.[0]?.toUpperCase() || "A"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Admin User"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || "admin@jbm.com"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-300 transition-all duration-200"
            type="button"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
        type="button"
        title="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
};

export default Sidebar;
