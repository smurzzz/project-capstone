import { useState, useEffect } from "react";
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
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button } from "../ui/button.jsx";
import logoSrc from "../../assets/logo (1).webp";

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

export const Sidebar = ({ isMobile = false, open, onClose }) => {
  const [isOpen, setIsOpen] = useState(Boolean(open));
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // keep internal state in sync when parent controls open
  useEffect(() => {
    if (open !== undefined) setIsOpen(Boolean(open));
  }, [open]);

  return (
    <>
      {isMobile && isOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => (onClose ? onClose() : setIsOpen(false))}
          type="button"
        />
      )}

      <aside
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "sticky top-0 self-start w-64 h-screen"
        } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt="JBM Electro logo"
              className="h-14 w-[64px] rounded-xl bg-white/10 p-2 object-contain border border-white/10"
            />
            <div>
              <h1 className="font-bold text-base">JBM ELECTRO</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          {isMobile && (
            <button onClick={() => (onClose ? onClose() : setIsOpen(false))} className="text-slate-400 hover:text-white" type="button">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map(({ name, path, icon, isParent }) => (
            <NavLink
              key={name}
              to={path}
              end={isParent}
              onClick={() => isMobile && (onClose ? onClose() : setIsOpen(false))}
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

      {/* don't render the floating open button when parent controls open */}
      {isMobile && open === undefined && (
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};

// Export both the component and a hook to control it
export default Sidebar;
