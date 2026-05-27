import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoutes = ({ children, requireRole }) => {
    const { user, loading } = useContext(AuthContext);
    const isAdminRoute = requireRole?.some((role) => String(role).toLowerCase() === "admin");
    const loginPath = isAdminRoute ? "/admin/login" : "/login";

    if (loading) {
        return (
            <div className="app-loader" role="status" aria-live="polite">
                <div className="app-loader__spinner" />
                <span>Loading</span>
            </div>
        );
    }

    if (!user) return <Navigate to={loginPath} replace />;

    const roleAllowed = !requireRole || requireRole.includes(user.role);
    const typeAllowed = !isAdminRoute || user.type === "staff";

    if (!roleAllowed || !typeAllowed) {
        return <Navigate to={loginPath} replace />;
    }

    return children;
};

export default ProtectedRoutes;
