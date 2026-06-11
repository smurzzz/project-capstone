import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { authAPI } from "../../utils/api.js";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Eye, EyeOff } from 'lucide-react';
import GoogleAuthButton from "../../components/auth/GoogleAuthButton.jsx";

export default function Login({ mode = "customer" }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [otp, setOtp] = useState("");
    const [pendingSession, setPendingSession] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const isStaffLogin = mode === "staff";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setNotice("");
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
                const isStaffUser = response.data.user?.type === "staff";
                navigate(isStaffUser ? "/admin" : "/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCredential = async (credential) => {
        setError("");
        setNotice("");
        setGoogleLoading(true);

        try {
            const response = await authAPI.googleCustomer(credential);

            if (response.data.success) {
                if (response.data.requiresOtp) {
                    setPendingSession({
                        user: response.data.user,
                        token: response.data.token,
                        email: response.data.user?.email,
                    });
                    setNotice(response.data.message || "Verification code sent to your email.");
                    return;
                }

                login(response.data.user, response.data.token);
                navigate("/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Google login failed");
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");

        if (!pendingSession?.email || !otp.trim()) {
            setError("Enter the verification code sent to your email");
            return;
        }

        setLoading(true);
        try {
            await authAPI.verifyOtp(pendingSession.email, otp.trim());
            login({ ...pendingSession.user, emailVerified: true }, pendingSession.token);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!pendingSession?.email) return;

        setError("");
        setNotice("");
        setLoading(true);
        try {
            await authAPI.requestOtp(pendingSession.email);
            setNotice("A new verification code was sent to your email.");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend verification code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-3">
                            <LogIn className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                        {isStaffLogin ? "Admin Login" : "Welcome Back"}
                    </h1>
                    <p className="text-sm text-gray-500 text-center mb-8">
                        {isStaffLogin ? "Authorized administrators only" : "Sign in to your JBM Electro Ventures account"}
                    </p>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {notice && (
                        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">{notice}</p>
                        </div>
                    )}

                    {pendingSession ? (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={otp}
                                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                    required
                                    disabled={loading}
                                    placeholder="Enter 6-digit code"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
                            >
                                {loading ? "Verifying..." : "Verify Email"}
                            </button>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleResendOtp}
                                className="w-full py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Resend Code
                            </button>
                        </form>
                    ) : (
                    <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>

                        {!isStaffLogin && (
                            <div className="text-right">
                                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                        )}
                    </form>
                    )}

                    {!isStaffLogin && !pendingSession && (
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-px flex-1 bg-gray-200" />
                                <span className="text-xs text-gray-500 font-medium">or</span>
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

                    {!isStaffLogin && !pendingSession && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
