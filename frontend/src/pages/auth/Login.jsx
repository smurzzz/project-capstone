import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { authAPI } from "../../utils/api.js";
import { useNavigate, Link } from "react-router-dom";
import { UserCircle } from 'lucide-react';;
import GoogleAuthButton from "../../components/auth/GoogleAuthButton.jsx";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isStaffLogin, setIsStaffLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let response;
            if (isStaffLogin) {
                response = await authAPI.loginStaff(email, password);
            } else {
                response = await authAPI.loginCustomer(email, password);
            }

            if (response.data.success) {
                login(response.data.user, response.data.token);
                navigate(isStaffLogin ? "/admin" : "/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCredential = async (credential) => {
        setError("");
        setGoogleLoading(true);

        try {
            const response = await authAPI.googleCustomer(credential);

            if (response.data.success) {
                login(response.data.user, response.data.token);
                navigate("/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Google login failed");
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md lg:max-w-lg bg-white rounded-2xl border border-gray-300 p-8 shadow-sm">
                <div className="flex items-center justify-center mb-4">
                    <div className="rounded-full bg-blue-100 p-3">
                    <UserCircle className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <h1 className="text-xl font-semibold text-center" >
                    {isStaffLogin ? "Staff Login" : "Welcome Back"}
                </h1>
                <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                    Sign in to your JBM Electro Ventures account
                </p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div style={styles.formGroup}>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="mt-1 w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label className="text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="mt-1 w-full px-4 py-2 rounded-lg bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="*******"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg cursor-pointer bg-black text-white font-medium hover:opacity-90 transition"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                {!isStaffLogin && (
                    <div className="mt-5 space-y-4">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="h-px flex-1 bg-gray-200" />
                            <span>or</span>
                            <span className="h-px flex-1 bg-gray-200" />
                        </div>
                        <GoogleAuthButton
                            disabled={loading || googleLoading}
                            onError={setError}
                            onSuccess={handleGoogleCredential}
                            text="signin_with"
                        />
                    </div>
                )}

                <div style={styles.toggleSection}>
                    <p>
                        {isStaffLogin ? "Are you a customer? " : "Are you staff? "}
                        <button
                            type="button"
                            onClick={() => setIsStaffLogin(!isStaffLogin)}
                            style={styles.toggleBtn}
                        >
                            {isStaffLogin ? "Customer Login" : "Staff Login"}
                        </button>
                    </p>
                </div>

                <div style={styles.signupSection}>
                    <p>
                        Don't have an account?{" "}
                        <Link to="/signup" style={styles.signupLink}>
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5"
    },
    card: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
    },
    title: {
        textAlign: "center",
        marginBottom: "30px",
        color: "#333"
    },
    error: {
        backgroundColor: "#fee",
        color: "#c33",
        padding: "10px",
        borderRadius: "4px",
        marginBottom: "20px",
        textAlign: "center"
    },
    formGroup: {
        marginBottom: "15px"
    },
    button: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
        marginTop: "10px"
    },
    toggleSection: {
        textAlign: "center",
        marginTop: "20px",
        fontSize: "14px"
    },
    toggleBtn: {
        background: "none",
        border: "none",
        color: "#007bff",
        cursor: "pointer",
        textDecoration: "underline"
    },
    signupSection: {
        textAlign: "center",
        marginTop: "15px",
        fontSize: "14px"
    },
    signupLink: {
        color: "#28a745",
        textDecoration: "none",
        fontWeight: "bold"
    }
};
