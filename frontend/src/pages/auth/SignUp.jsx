import React, { useState } from "react";
import { authAPI } from "../../utils/api.js";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton.jsx";

export default function SignUp() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        address: ""
    });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
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
                password: formData.password
            });

            if (response.data.success) {
                login(response.data.user, response.data.token);
                navigate("/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md lg:max-w-lg bg-white rounded-2xl border border-gray-300 p-8 shadow-sm">
                <h1 style={styles.title}>Create Account</h1>
                <p style={styles.subtitle}>Join us as a customer</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your full name"
                            className=" w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your email"
                            className=" w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Phone:</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your phone number"
                            className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Address:</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Enter your address"
                            className="w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Create a password"
                            className="mt- w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Confirm Password:</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="Confirm your password"
                            className="mt- w-full px-4 py-2 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 cursor-pointer py-2.5 rounded-lg bg-black text-white font-medium hover:opacity-90 transition"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

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
                        text="signup_with"
                    />
                </div>

                <div style={styles.loginSection}>
                    <p>
                        Already have an account?{" "}
                        <Link to="/login" style={styles.loginLink}>
                            Login here
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
        backgroundColor: "#f5f5f5",
        padding: "20px"
    },
    card: {
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "450px"
    },
    title: {
        textAlign: "center",
        marginBottom: "10px",
        color: "#333",
        fontSize: "28px"
    },
    subtitle: {
        textAlign: "center",
        marginBottom: "30px",
        color: "#666",
        fontSize: "16px"
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
        padding: "12px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
        marginTop: "10px"
    },
    loginSection: {
        textAlign: "center",
        marginTop: "20px",
        fontSize: "14px"
    },
    loginLink: {
        color: "#007bff",
        textDecoration: "none"
    }
};
