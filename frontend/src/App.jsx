import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Sidebar from "./components/admin/Sidebar";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoutes from "./utils/ProtectedRoutes";

const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));
const Appointments = lazy(() => import("./pages/admin/Appointments"));
const Customers = lazy(() => import("./pages/admin/Customers"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const StaffManagement = lazy(() => import("./pages/admin/StaffManagement"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ClientHomepage = lazy(() => import("./pages/client/ClientHomepage"));
const ClientTracking = lazy(() => import("./pages/client/ClientTracking"));
const Settings = lazy(() => import("./pages/shared/Settings"));

const PageLoader = () => (
  <div className="app-loader" role="status" aria-live="polite">
    <div className="app-loader__spinner" />
    <span>Loading</span>
  </div>
);

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
                <ProtectedRoutes requireRole={["Admin", "admin"]}>
                  <div style={styles.layoutContainer}>
                    <Sidebar />
                    <div style={styles.mainContent}>
                      <Routes>
                        <Route path="/" element={<AdminDashboard />} />
                        <Route path="/dashboard" element={<AdminDashboard />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/packages" element={<AdminPackages />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/staff" element={<StaffManagement />} />
                        <Route path="/appointments" element={<Appointments />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                      </Routes>
                    </div>
                  </div>
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
  layoutContainer: {
    display: "flex",
    minHeight: "100vh",
  },
  mainContent: {
    flex: 1,
    overflow: "auto",
    backgroundColor: "var(--brand-surface)",
  },
};

export default App;
