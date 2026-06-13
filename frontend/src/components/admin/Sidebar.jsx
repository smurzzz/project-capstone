import { useState } from "react";
import {
  Building2,
  Calendar,
  BarChart3,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Settings,
  ShoppingCart,
  User,
  Users,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button } from "../ui/button.jsx";
import logoSrc from "../../assets/logo.webp";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <Home className="h-5 w-5" />, isParent: true },
  { name: "Orders", path: "/admin/orders", icon: <ShoppingCart className="h-5 w-5" /> },
  { name: "Appointments", path: "/admin/appointments", icon: <Calendar className="h-5 w-5" /> },
  { name: "Inventory", path: "/admin/inventory", icon: <Package className="h-5 w-5" /> },
  { name: "Package Deals", path: "/admin/packages", icon: <PackagePlus className="h-5 w-5" /> },
  { name: "Staff", path: "/admin/staff", icon: <Users className="h-5 w-5" /> },
  { name: "Memberships", path: "/admin/memberships", icon: <Users className="h-5 w-5" /> },
  { name: "FAQs", path: "/admin/faqs", icon: <Building2 className="h-5 w-5" /> },
  { name: "Reports", path: "/admin/reports", icon: <BarChart3 className="h-5 w-5" /> },
];

export const Sidebar = ({ isMobile = false, open, onClose }) => {
  const [isOpen, setIsOpen] = useState(Boolean(open));
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSidebarOpen = open !== undefined ? Boolean(open) : isOpen;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSettings = () => {
    setAccountMenuOpen(false);
    if (isMobile) {
      onClose ? onClose() : setIsOpen(false);
    }
    navigate("/admin/settings");
  };

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close sidebar overlay"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => (onClose ? onClose() : setIsOpen(false))}
            type="button"
          />
        </div>
      )}

      <aside
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "!w-64 h-[100dvh]"
        } bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col`}
      >
        <div className="sticky top-0 z-50 md:relative p-6 border-b border-slate-700 bg-transparent">
          <div className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt="JBM Electro logo"
              className="!h-12 !w-12 md:!h-14 md:!w-[64px] rounded-xl bg-white/10 p-1 md:p-2 object-contain border border-white/10"
            />
            <div>
              <h1 className="!text-sm md:!text-base font-bold truncate">JBM Electro</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>

          {isMobile && (
            <button
              onClick={() => (onClose ? onClose() : setIsOpen(false))}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
              type="button"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems
            .filter(({ name }) => {
              const userRole = String(user?.role || "").toLowerCase();
              if (userRole === "staff") {
                // For staff accounts: hide Staff and Memberships only — keep FAQs visible
                return name !== "Staff" && name !== "Memberships";
              }
              return true;
            })
            .map(({ name, path, icon, isParent }) => (
              <NavLink
                key={name}
                to={path}
                end={isParent}
                onClick={() => isMobile && (onClose ? onClose() : setIsOpen(false))}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
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
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
          >
            <User className="h-5 w-5 flex-shrink-0" />
            <span className="text-base font-medium flex-1 text-left">Account</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform flex-shrink-0 ${
                accountMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {accountMenuOpen && (
            <div className="p-4 bg-slate-700/50 rounded-lg space-y-3 border border-slate-600">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-semibold text-white">{user?.name?.[0]?.toUpperCase() || "A"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">Logged in as</p>
                  <p className="text-base font-semibold text-white truncate">{user?.name || "Admin User"}</p>
                  <p className="text-sm text-slate-400 truncate">{user?.email || "admin@jbm.com"}</p>
                </div>
              </div>
              <div className="h-px bg-slate-600" />
              <button
                type="button"
                onClick={handleSettings}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-slate-300 transition-all duration-200 hover:bg-slate-600"
              >
                <Settings className="h-5 w-5" />
                Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-red-300 transition-all duration-200 hover:bg-red-600/20"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          )}
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
