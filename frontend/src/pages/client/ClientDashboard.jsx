/* eslint-disable react-hooks/set-state-in-effect, react-hooks/static-components */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  Calendar,
  ChevronDown,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  User,
  Zap,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { membershipAPI } from "../../utils/api.js";
import { getDaysUntilExpiration, isMembershipExpired } from "../../utils/membership";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import logoSrc from "../../assets/logo.webp";
import ClientAppointments from "./ClientAppointments.jsx";
import ClientHome from "./ClientHome.jsx";
import ClientOrderForm from "./ClientOrderForm.jsx";
import ClientPackages from "./ClientPackages.jsx";
import ClientProducts from "./ClientProducts.jsx";
import ClientTracking from "./ClientTracking.jsx";
import SettingsPage from "../shared/Settings.jsx";
import { appointmentsAPI, ordersAPI } from "../../utils/api.js";

const getStoredReadNotifications = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`jbm-read-notifications-${userId}`) || "[]");
  } catch {
    return [];
  }
};

const saveStoredReadNotifications = (userId, readIds) => {
  localStorage.setItem(`jbm-read-notifications-${userId}`, JSON.stringify([...new Set(readIds)]));
};

const orderStatusMessage = (order) => {
  const reference = order.referenceNumber || "your order";
  const messages = {
    Pending: `${reference} is pending and waiting for admin review.`,
    Confirmed: `${reference} has been confirmed by admin.`,
    Completed: `${reference} has been completed.`,
    Cancelled: `${reference} was cancelled.`,
  };

  return messages[order.status] || `${reference} status changed to ${order.status}.`;
};

const appointmentStatusMessage = (appointment) => {
  const appointmentId = `APT-${appointment._id?.slice(-6)?.toUpperCase() || "000000"}`;
  const messages = {
    Scheduled: `${appointmentId} is scheduled and waiting for confirmation.`,
    Confirmed: `${appointmentId} has been confirmed by admin.`,
    Completed: `${appointmentId} has been completed.`,
    Cancelled: `${appointmentId} was cancelled.`,
  };

  return messages[appointment.status] || `${appointmentId} status changed to ${appointment.status}.`;
};

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle hash navigation for setting active tab and location state
  useEffect(() => {
    // Check if coming from navigation with state
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      setSelectedPackage(location.state.membershipPackage || null);
    } else {
      // Fallback to hash navigation
      const hash = window.location.hash;
      if (hash === '#order') {
        setActiveTab('order');
        // Clear the hash after processing
        window.history.replaceState(null, null, window.location.pathname);
      } else if (hash === '#packages') {
        setActiveTab('packages');
        window.history.replaceState(null, null, window.location.pathname);
      } else if (hash === '#products') {
        setActiveTab('products');
        window.history.replaceState(null, null, window.location.pathname);
      }
    }
  }, [location]);

  // Generate user-specific notifications from real order and appointment statuses.
  useEffect(() => {
    if (!user) return;

    const buildNotifications = async () => {
      const readIds = getStoredReadNotifications(user.id);
      const userNotifications = [
        {
          id: `welcome-${user.id}`,
          title: "Welcome to JBM Electro",
          message: "Browse products, order packages, and book service appointments.",
          time: "Account",
          unread: !readIds.includes(`welcome-${user.id}`),
          type: "welcome",
          action: "products",
        },
      ];

      try {
        const [ordersResponse, appointmentsResponse] = await Promise.all([
          user.customerId ? ordersAPI.getByCustomer(user.customerId) : Promise.resolve({ data: { data: [] } }),
          user?.type === "customer"
            ? appointmentsAPI.getMyAppointments()
            : Promise.resolve({ data: { data: [] } }),
        ]);
        const orders = ordersResponse.data.data || [];
        const appointments = appointmentsResponse.data.data || [];

        orders.forEach((order) => {
          const id = `order-${order._id}-${order.status}`;
          userNotifications.push({
            id,
            title: `Order ${order.status}`,
            message: orderStatusMessage(order),
            time: order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "Order update",
            unread: !readIds.includes(id),
            type: "order",
            action: "tracking",
          });
        });

        appointments.forEach((appointment) => {
          const id = `appointment-${appointment._id}-${appointment.status}`;
          userNotifications.push({
            id,
            title: `Appointment ${appointment.status}`,
            message: appointmentStatusMessage(appointment),
            time: appointment.updatedAt ? new Date(appointment.updatedAt).toLocaleString() : "Appointment update",
            unread: !readIds.includes(id),
            type: "appointment",
            action: "tracking",
          });
        });

        // Check membership expiry for customers and add notification/toast
        try {
          if (user?.type === "customer") {
            const membRes = await membershipAPI.getMyMembership();
            const membData = membRes.data.data || null;
            const membership = membData?.membership || null;
            if (membership && membership.expiresAt) {
              const days = getDaysUntilExpiration(membership.expiresAt);
              const expired = isMembershipExpired(membership);
              const id = `membership-${user.id}-${membership.expiresAt}`;
              if (expired) {
                userNotifications.push({
                  id,
                  title: "Membership expired",
                  message: "Your membership has expired.",
                  time: membership.expiresAt ? new Date(membership.expiresAt).toLocaleString() : "Now",
                  unread: !readIds.includes(id),
                  type: "membership",
                  action: "membership",
                });
                if (!readIds.includes(id)) toast.error("Your membership has expired.");
              } else if (days <= 7) {
                userNotifications.push({
                  id,
                  title: "Membership expiring soon",
                  message: `Your membership expires in ${days} day${days === 1 ? "" : "s"}`,
                  time: membership.expiresAt ? new Date(membership.expiresAt).toLocaleString() : "",
                  unread: !readIds.includes(id),
                  type: "membership",
                  action: "membership",
                });
                if (!readIds.includes(id)) toast(`Your membership expires in ${days} day${days === 1 ? "" : "s"}`);
              }
            }
          }
        } catch (e) {
          console.error("Error loading membership status for notifications:", e);
        }

        setNotifications(userNotifications);
      } catch (error) {
        console.error("Error loading notifications:", error);
        setNotifications(userNotifications);
      }
    };

    buildNotifications();
    const interval = window.setInterval(buildNotifications, 30000);

    return () => window.clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openSettings = () => {
    setNotificationsOpen(false);
    setAccountMenuOpen(false);
    setActiveTab("settings");
  };

  const handleNotificationClick = (notification) => {
    const readIds = getStoredReadNotifications(user.id);
    saveStoredReadNotifications(user.id, [...readIds, notification.id]);

    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, unread: false } : n
      )
    );

    setNotificationsOpen(false);

    if (notification.action) {
      if (notification.action === '/tracking') {
        navigate('/dashboard');
        setActiveTab('tracking');
      } else if (notification.action.startsWith('/')) {
        navigate(notification.action);
      } else {
        setActiveTab(notification.action);
      }
    }
  };

  const markAllAsRead = () => {
    saveStoredReadNotifications(user.id, notifications.map((notification) => notification.id));
    setNotifications(prev => 
      prev.map(n => ({ ...n, unread: false }))
    );
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setActiveTab("order");
  };

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "products", label: "Products", icon: Package },
    { id: "packages", label: "Package Deals", icon: ShoppingBag },
    { id: "order", label: "Place Order", icon: ClipboardList },
    { id: "appointments", label: "Book Appointment", icon: Calendar },
    { id: "tracking", label: "Track Status", icon: ClipboardList },
  ];

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const Sidebar = ({ isMobile = false }) => (
    <div
      className={`${isMobile ? "w-full" : "w-72"} bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white ${
        isMobile ? "min-h-screen" : "h-[100dvh]"
      } flex flex-col`}
    >
      <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt="JBM Electro logo"
            className="!h-12 !w-12 md:!h-14 md:!w-[64px] rounded-xl bg-white/10 p-1 md:p-2 object-contain border border-white/10"
          />
          <div>
            <h1 className="!text-base md:!text-lg font-bold truncate">JBM Electro</h1>
            <p className="text-sm text-slate-400">Client Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
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
                  <span className="font-semibold text-white">{user?.name?.[0]?.toUpperCase() || "C"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="text-base font-semibold text-white truncate">{user?.name || "Customer"}</p>
                <p className="text-sm text-slate-400 truncate">{user?.email || "customer@example.com"}</p>
              </div>
            </div>
            <div className="h-px bg-slate-600" />
            <button
              type="button"
              onClick={() => {
                setAccountMenuOpen(false);
                setActiveTab("settings");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-600 rounded transition-all duration-200"
            >
              <Settings className="h-5 w-5" />
              Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-300 hover:bg-red-600/20 rounded transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close customer menu"
          />
          <div className="relative z-50 w-64">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 text-slate-200 hover:text-white z-50"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar isMobile />
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:ml-64">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open customer menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={openSettings}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-50 min-w-0 group"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 text-blue-700 flex items-center justify-center shrink-0">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user?.name || "Customer profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-white">
                    {user?.name?.[0]?.toUpperCase() || "C"}
                  </span>
                )}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || "Customer"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || "customer@example.com"}
                </p>
              </div>
            </button>

            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs font-semibold rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-lg z-30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                        <Badge variant="secondary">{unreadCount} new</Badge>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:bg-gray-50 ${
                            notification.unread
                              ? "bg-blue-50 border-blue-200"
                              : "bg-white border-gray-100"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                            {notification.unread && (
                              <div className="h-2.5 w-2.5 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                      {notifications.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
          {activeTab === "home" && <ClientHome onNavigateTab={setActiveTab} />}
          {activeTab === "products" && <ClientProducts />}
          {activeTab === "packages" && (
            <ClientPackages onSelectPackage={handleSelectPackage} />
          )}
          {activeTab === "order" && <ClientOrderForm selectedPackage={selectedPackage} onCancelPackage={() => setSelectedPackage(null)} />}
          {activeTab === "appointments" && <ClientAppointments />}
          {activeTab === "tracking" && <ClientTracking />}
          {activeTab === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
