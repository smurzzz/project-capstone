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
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));
const AdminMemberships = lazy(() => import("./pages/admin/AdminMemberships"));
const Appointments = lazy(() => import("./pages/admin/Appointments"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const StaffManagement = lazy(() => import("./pages/admin/StaffManagement"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientHomepage = lazy(() => import("./pages/client/ClientHomepage"));
const ClientTracking = lazy(() => import("./pages/client/ClientTracking"));
const MembershipApplication = lazy(() => import("./pages/client/MembershipApplication"));
const MembershipApplicationForm = lazy(() => import("./pages/client/MembershipApplicationForm"));
const MembershipStatus = lazy(() => import("./pages/client/MembershipStatus"));
const Settings = lazy(() => import("./pages/shared/Settings"));
const FAQ = lazy(() => import("./pages/shared/FAQ"));
const WarrantyReturns = lazy(() => import("./pages/shared/WarrantyReturns"));
const Terms = lazy(() => import("./pages/shared/Terms"));
const Privacy = lazy(() => import("./pages/shared/Privacy"));

const PageLoader = () => (
  <div className="app-loader" role="status" aria-live="polite">
    <div className="app-loader__spinner" />
    <span>Loading</span>
  </div>
);

const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="truncate text-sm font-semibold text-gray-900">JBM Electro Admin</span>
        </div>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[var(--brand-surface)]">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route
              path="/inventory"
              element={
                <ProtectedRoutes requireRole={["Admin", "Staff"]}>
                  <Inventory />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/packages"
              element={
                <ProtectedRoutes requireRole={["Admin", "Staff"]}>
                  <AdminPackages />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/memberships"
              element={
                <ProtectedRoutes requireRole={["Admin"]}>
                  <AdminMemberships />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoutes requireRole={["Admin", "Staff"]}>
                  <Orders />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoutes requireRole={["Admin", "Staff"]}>
                  <Customers />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoutes requireRole={["Admin"]}>
                  <StaffManagement />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoutes requireRole={["Admin", "Staff"]}>
                  <Appointments />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoutes requireRole={["Admin", "Staff"]}>
                  <Reports />
                </ProtectedRoutes>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoutes requireRole={["Admin", "Staff"]}>
                  <Settings />
                </ProtectedRoutes>
              }
            />
              <Route
                path="/faqs"
                element={
                  <ProtectedRoutes requireRole={["Admin"]}>
                    <AdminFAQ />
                  </ProtectedRoutes>
                }
            />
          </Routes>
        </main>
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

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

            <Route path="/faq" element={<FAQ />} />
            <Route path="/warranty-returns" element={<WarrantyReturns />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Public landing page - always accessible */}
            <Route path="/" element={<ClientHomepage />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster richColors closeButton />
    </CartProvider>
  </AuthProvider>
);

export default App;
