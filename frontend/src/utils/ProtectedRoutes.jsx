import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProtectedRoutes = ({ children, requireRole }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (requireRole && !requireRole.includes(user.role)) {
            navigate("/unauthorized");
        }

    }, [user, navigate, requireRole]);

    // while checking
    if (!user) return null;

    // block unauthorized
    if (requireRole && !requireRole.includes(user.role)) return null;

    // ✅ allow access
    return children;
};

export default ProtectedRoutes;