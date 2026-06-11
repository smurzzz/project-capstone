import bcrypt from "bcrypt";
import crypto from "crypto";
import EmailToken from "../models/EmailToken.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Staff from "../models/Staff.js";
import User from "../models/User.js";
import {
    cleanString,
    isStrongPassword,
    isValidEmail,
    normalizeEmail,
} from "../utils/validation.js";
import {
    sendAdminNotificationEmail,
    sendOtpVerificationEmail,
    sendPasswordResetEmail,
    sendReceiptEmail,
} from "../utils/emailService.js";

const SALT_ROUNDS = 12;
const OTP_TTL_MINUTES = Number(process.env.EMAIL_OTP_TTL_MINUTES || 10);
const RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30);

const hashToken = (token) =>
    crypto.createHash("sha256").update(String(token)).digest("hex");

const buildExpiry = (minutes) =>
    new Date(Date.now() + Number(minutes || 10) * 60 * 1000);

const createEmailToken = async ({ email, purpose, token, expiresInMinutes }) => {
    await EmailToken.updateMany(
        { email, purpose, usedAt: null },
        { $set: { usedAt: new Date() } }
    );

    return EmailToken.create({
        email,
        purpose,
        tokenHash: hashToken(token),
        expiresAt: buildExpiry(expiresInMinutes),
    });
};

const consumeEmailToken = async ({ email, purpose, token }) => {
    const emailToken = await EmailToken.findOne({
        email,
        purpose,
        tokenHash: hashToken(token),
        usedAt: null,
        expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!emailToken) {
        return false;
    }

    emailToken.usedAt = new Date();
    await emailToken.save();
    return true;
};

const findAccountByEmail = async (email) => {
    const [user, staff] = await Promise.all([
        User.findOne({ email }),
        Staff.findOne({ email }),
    ]);

    return user || staff || null;
};

export const requestOtpVerification = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required",
            });
        }

        const account = await findAccountByEmail(email);
        const otp = crypto.randomInt(100000, 999999).toString();
        await createEmailToken({
            email,
            purpose: "otp_verification",
            token: otp,
            expiresInMinutes: OTP_TTL_MINUTES,
        });

        if (account) {
            await sendOtpVerificationEmail({
                to: email,
                name: account.name,
                otp,
                expiresInMinutes: OTP_TTL_MINUTES,
            });
        }

        return res.status(200).json({
            success: true,
            message: "If the email is registered, a verification code has been sent",
        });
    } catch (error) {
        console.error("Request OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send verification code",
        });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = cleanString(req.body.otp, 12);

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const isValid = await consumeEmailToken({
            email,
            purpose: "otp_verification",
            token: otp,
        });

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
            });
        }

        await User.findOneAndUpdate({ email }, { $set: { emailVerified: true } });

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify email",
        });
    }
};

export const requestPasswordReset = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        console.log("[PASSWORD_RESET] Request received for:", email || "(missing email)");

        if (!email || !isValidEmail(email)) {
            console.log("[PASSWORD_RESET] Invalid email");
            return res.status(400).json({
                success: false,
                message: "A valid email address is required",
            });
        }

        const account = await findAccountByEmail(email);
        console.log("[PASSWORD_RESET] Account lookup:", account ? "FOUND" : "NOT FOUND");

        const resetToken = crypto.randomBytes(32).toString("hex");

        if (account) {
            console.log("[PASSWORD_RESET] Creating reset token");
            await createEmailToken({
                email,
                purpose: "password_reset",
                token: resetToken,
                expiresInMinutes: RESET_TTL_MINUTES,
            });

            const appUrl = process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || "";
            const resetUrl = appUrl
                ? `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`
                : "";

            console.log("[PASSWORD_RESET] Sending reset email to:", email);
            const emailResult = await sendPasswordResetEmail({
                to: email,
                name: account.name,
                resetToken,
                resetUrl,
                expiresInMinutes: RESET_TTL_MINUTES,
            });
            console.log("[PASSWORD_RESET] Email send result:", emailResult ? "SENT" : "FAILED");

            if (!emailResult) {
                return res.status(503).json({
                    success: false,
                    message: "Password reset email could not be sent. Check SMTP configuration and server logs.",
                });
            }
        } else {
            console.log("[PASSWORD_RESET] No account found for:", email);
        }

        return res.status(200).json({
            success: true,
            message: "If the email is registered, a password reset email has been sent",
        });
    } catch (error) {
        console.error("[PASSWORD_RESET] Request failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send password reset email",
        });
    }
};
export const resetPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const token = cleanString(req.body.token, 200);
        const { password } = req.body;

        if (!email || !token || !password) {
            return res.status(400).json({
                success: false,
                message: "Email, token, and new password are required",
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and include a letter and a number",
            });
        }

        const account = await findAccountByEmail(email);
        if (!account) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        const isValid = await consumeEmailToken({
            email,
            purpose: "password_reset",
            token,
        });

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        account.password = await bcrypt.hash(password, SALT_ROUNDS);
        account.authProvider = account.authProvider === "google" ? "password" : account.authProvider;
        await account.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reset password",
        });
    }
};

export const sendAdminNotification = async (req, res) => {
    try {
        const to = req.body.to || process.env.ADMIN_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
        const subject = cleanString(req.body.subject, 200) || "Admin notification";
        const title = cleanString(req.body.title, 200) || subject;
        const message = cleanString(req.body.message, 2000);
        const details = typeof req.body.details === "object" && req.body.details !== null
            ? req.body.details
            : {};

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Notification message is required",
            });
        }

        const sent = await sendAdminNotificationEmail({ to, subject, title, message, details });

        return res.status(sent ? 200 : 503).json({
            success: sent,
            message: sent ? "Admin notification sent" : "Email service is not configured",
        });
    } catch (error) {
        console.error("Send admin notification error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send admin notification",
        });
    }
};

export const sendOrderReceipt = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate("customerId", "name contactInfo role");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const items = await OrderItem.find({ orderId: order._id });
        const to = normalizeEmail(req.body.to) || order.email || order.customerId?.contactInfo?.email;

        if (!to) {
            return res.status(400).json({
                success: false,
                message: "Receipt recipient email is required",
            });
        }

        const sent = await sendReceiptEmail({
            to,
            order: order.toObject(),
            items,
        });

        return res.status(sent ? 200 : 503).json({
            success: sent,
            message: sent ? "Receipt email sent" : "Email service is not configured",
        });
    } catch (error) {
        console.error("Send order receipt error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send receipt email",
        });
    }
};
