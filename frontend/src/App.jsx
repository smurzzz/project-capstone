import { lazy, Suspense, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Sidebar } from "./components/admin/Sidebar";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import { Button } from "./components/ui/button.jsx";
import { Menu } from "lucide-react";

const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));
const AdminMemberships = lazy(() => import("./pages/admin/AdminMemberships"));
const Appointments = lazy(() => import("./pages/admin/Appointments"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const StaffManagement = lazy(() => import("./pages/admin/StaffManagement"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientHomepage = lazy(() => import("./pages/client/ClientHomepage"));
const ClientTracking = lazy(() => import("./pages/client/ClientTracking"));
const MembershipApplication = lazy(() => import("./pages/client/MembershipApplication"));
const MembershipApplicationForm = lazy(() => import("./pages/client/MembershipApplicationForm"));
const MembershipStatus = lazy(() => import("./pages/client/MembershipStatus"));
const Settings = lazy(() => import("./pages/shared/Settings"));

const PageLoader = () => (
  <div className="app-loader" role="status" aria-live="polite">
    <div className="app-loader__spinner" />
    <span>Loading</span>
  </div>
);

const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            aria-label="Close admin menu"
          />
          <div className="relative z-50 w-64">
            <Sidebar isMobile open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div style={styles.mainContent}>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/packages" element={<AdminPackages />} />
            <Route path="/memberships" element={<AdminMemberships />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route
              path="/staff"
              element={
                <ProtectedRoutes requireRole={["Admin"]}>
                  <StaffManagement />
                </ProtectedRoutes>
              }
            />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <CartProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login mode="staff" />} />
            <Route path="/signup" element={<SignUp />} />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoutes requireRole={["Admin", "Staff"]}>
                  <AdminLayout />
                </ProtectedRoutes>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoutes requireRole={["customer"]}>
                  <ClientDashboard />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoutes requireRole={["customer"]}>
                  <ClientTracking />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/membership/apply"
              element={
                <ProtectedRoutes requireRole={["customer"]}>
                  <MembershipApplicationForm />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/membership/status"
              element={
                <ProtectedRoutes requireRole={["customer"]}>
                  <MembershipStatus />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoutes requireRole={["customer"]}>
                  <Settings />
                </ProtectedRoutes>
              }
            />

            <Route path="/" element={<ClientHomepage />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster richColors closeButton />
    </CartProvider>
  </AuthProvider>
);

const styles = {
  mainContent: {
    flex: 1,
    overflow: "auto",
    backgroundColor: "var(--brand-surface)",
  },
};

export default App;
