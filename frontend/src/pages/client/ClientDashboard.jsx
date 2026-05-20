/* eslint-disable react-hooks/set-state-in-effect, react-hooks/static-components */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Badge } from "../../components/ui/badge.jsx";
import { Button } from "../../components/ui/button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
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

  // Handle hash navigation for setting active tab
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#order') {
      setActiveTab('order');
      // Clear the hash after processing
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, []);

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
          appointmentsAPI.getMyAppointments(),
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
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const Sidebar = ({ isMobile = false }) => (
    <div
      className={`${isMobile ? "w-full" : "w-64"} bg-blue-900 text-white ${
        isMobile ? "min-h-screen" : "h-screen sticky top-0"
      } flex flex-col`}
    >
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6" />
          <div>
            <h1 className="text-lg font-bold">JBM Electro</h1>
            <p className="text-xs text-blue-300">Client Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <button
          type="button"
          onClick={() => setAccountMenuOpen((open) => !open)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-800 transition-colors"
        >
          <User className="h-5 w-5" />
          <span>Account Info</span>
          <ChevronDown
            className={`h-4 w-4 ml-auto transition-transform ${
              accountMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {accountMenuOpen && (
          <div className="mt-2 p-4 bg-blue-800 rounded-lg space-y-3">
            <div className="text-sm">
              <div className="h-12 w-12 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center mb-3">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-semibold">{user?.name?.[0]?.toUpperCase() || "C"}</span>
                )}
              </div>
              <p className="text-blue-300 text-xs">Logged in as</p>
              <p className="font-semibold">{user?.name || "Customer"}</p>
              <p className="text-blue-300 text-xs">{user?.email || "customer@example.com"}</p>
            </div>
            <div className="h-px bg-blue-700" />
            <button
              type="button"
              onClick={() => {
                setAccountMenuOpen(false);
                setActiveTab("settings");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-100 hover:bg-blue-700 rounded transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-900/30 rounded transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close customer menu"
          />
          <div className="relative z-50 w-64">
            <Sidebar isMobile />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={openSettings}
              className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50 min-w-0"
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user?.name || "Customer profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {user?.name?.[0]?.toUpperCase() || "C"}
                  </span>
                )}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 truncate">
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
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border bg-white p-4 shadow-lg z-30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark all as read
                          </button>
                        )}
                        <Badge variant="secondary">{unreadCount} new</Badge>
                      </div>
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="space-y-3 max-h-96 overflow-auto">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-gray-100 ${
                            notification.unread
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{notification.title}</p>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                            {notification.unread && (
                              <div className="h-2 w-2 bg-blue-600 rounded-full mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                      {notifications.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {activeTab === "home" && <ClientHome />}
          {activeTab === "products" && <ClientProducts />}
          {activeTab === "packages" && (
            <ClientPackages onSelectPackage={handleSelectPackage} />
          )}
          {activeTab === "order" && <ClientOrderForm selectedPackage={selectedPackage} />}
          {activeTab === "appointments" && <ClientAppointments />}
          {activeTab === "tracking" && <ClientTracking />}
          {activeTab === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
