import React, { useState } from "react";
import { authAPI } from "../../utils/api.js";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton.jsx";

export default function SignUp() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        address: "",
        emailNotificationsEnabled: true
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [otp, setOtp] = useState("");
    const [pendingSession, setPendingSession] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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
            setError(err.response?.data?.message || "Google sign up failed");
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setNotice("");

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.address) {
            setError("All fields are required");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password) || formData.password.length < 8) {
            setError("Password must be at least 8 characters and include a letter and a number");
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.registerCustomer({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                password: formData.password,
                emailNotificationsEnabled: formData.emailNotificationsEnabled
            });

            if (response.data.success) {
                setPendingSession({
                    user: response.data.user,
                    token: response.data.token,
                    email: response.data.user?.email || formData.email,
                });
                setNotice(response.data.message || "Verification code sent to your email.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="rounded-full bg-gradient-to-br from-green-500 to-emerald-500 p-3">
                            <UserPlus className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Create Account</h1>
                    <p className="text-sm text-gray-500 text-center mb-8">Join us as a customer</p>

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
                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:shadow-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Enter your email"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Enter your phone number"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Enter your address"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="Create a password"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors pr-10"
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="Confirm your password"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="emailNotifications"
                                name="emailNotificationsEnabled"
                                checked={formData.emailNotificationsEnabled}
                                onChange={(e) => setFormData({ ...formData, emailNotificationsEnabled: e.target.checked })}
                                disabled={loading}
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="emailNotifications" className="text-sm text-gray-700">
                                Send me order confirmations, appointment updates, and receipts via email
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 mt-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:shadow-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>
                    )}

                    {!pendingSession && (
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
                            text="signup_with"
                        />
                    </div>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
