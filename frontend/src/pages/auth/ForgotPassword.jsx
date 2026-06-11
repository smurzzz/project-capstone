import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../../utils/api.js";
import { Mail } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Email is required");
            return;
        }

        setLoading(true);
        try {
            await authAPI.requestPasswordReset(email);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send reset email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="rounded-full bg-gradient-to-br from-orange-500 to-red-500 p-3">
                            <Mail className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                        Reset Password
                    </h1>
                    <p className="text-sm text-gray-500 text-center mb-8">
                        Enter your email to receive a password reset link
                    </p>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {submitted ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-700 font-medium">
                                    If an account exists for {email}, you will receive a password reset email shortly.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Check your inbox for an email with a reset link. The link will expire in 30 minutes.
                                </p>
                                <p className="text-sm text-gray-600">
                                    Don't see the email? Check your spam folder.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Remember your password?{" "}
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
