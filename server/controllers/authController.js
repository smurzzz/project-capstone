import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";
import MembershipHistory from "../models/MembershipHistory.js";
import EmailToken from "../models/EmailToken.js";
import { signAuthToken } from "../middleware/auth.js";
import { cleanString, isStrongPassword, normalizeEmail } from "../utils/validation.js";
import { verifyGoogleIdToken } from "../utils/googleAuth.js";
import { sendOtpVerificationEmail } from "../utils/emailService.js";

const SALT_ROUNDS = 12;
const OTP_TTL_MINUTES = Number(process.env.EMAIL_OTP_TTL_MINUTES || 10);

const buildDefaultMembership = ({ status = "Pending", tier = "Silver" } = {}) => {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    return {
        status,
        tier,
        pointsBalance: 0,
        joinedAt: new Date(),
        approvedAt: status === "Active" ? new Date() : null,
        expiresAt,
        renewalCount: 0,
    };
};

const buildNoMembership = () => ({
    status: "None",
    tier: "Silver",
    pointsBalance: 0,
    joinedAt: null,
    approvedAt: null,
    expiresAt: null,
    renewalCount: 0,
});

const buildCustomerPayload = (user, customer) => ({
    id: user._id,
    customerId: customer?._id || user.customerId || null,
    name: user.name,
    email: user.email,
    phone: user.phone || customer?.contactInfo?.phone || "",
    address: user.address || customer?.contactInfo?.address || "",
    profileImageUrl: user.profileImageUrl || customer?.profileImageUrl || "",
    role: user.role,
    memberRole: customer?.role || "Member",
    membership: customer?.membership || buildDefaultMembership(),
    emailVerified: Boolean(user.emailVerified),
    type: "customer",
});

const hashToken = (token) =>
    crypto.createHash("sha256").update(String(token)).digest("hex");

const sendRegistrationOtp = async (user) => {
    const otp = crypto.randomInt(100000, 999999).toString();

    await EmailToken.updateMany(
        { email: user.email, purpose: "otp_verification", usedAt: null },
        { $set: { usedAt: new Date() } }
    );

    await EmailToken.create({
        email: user.email,
        purpose: "otp_verification",
        tokenHash: hashToken(otp),
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    });

    return sendOtpVerificationEmail({
        to: user.email,
        name: user.name,
        otp,
        expiresInMinutes: OTP_TTL_MINUTES,
    });
};

const buildStaffPayload = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    address: user.department || "",
    profileImageUrl: user.profileImageUrl || "",
    role: user.role,
    type: "staff",
});

const getStaffAccountByToken = async (tokenUser) => {
    let user = await Staff.findById(tokenUser.id);

    if (user && !user.isActive) {
        return null;
    }

    if (!user) {
        user = await User.findOne({ _id: tokenUser.id, role: "admin" });
    }

    return user;
};

const getOrCreateCustomerProfile = async ({ name, email, phone, address }) => {
    const existingCustomer = await Customer.findOne({ "contactInfo.email": email });

    if (existingCustomer) {
        existingCustomer.name = name || existingCustomer.name;
        existingCustomer.contactInfo.phone = phone || existingCustomer.contactInfo.phone;
        existingCustomer.contactInfo.address = address || existingCustomer.contactInfo.address;
        existingCustomer.role = existingCustomer.role || "Guest";
        existingCustomer.membership = existingCustomer.membership || buildNoMembership();
        existingCustomer.updatedAt = new Date();
        await existingCustomer.save();
        return existingCustomer;
    }

    return Customer.create({
        name,
        contactInfo: {
            email,
            phone,
            address,
        },
        role: "Guest",
        membership: buildNoMembership(),
    });
};

const issueCustomerSession = async (user) => {
    let customer = null;

    if (user.customerId) {
        customer = await Customer.findById(user.customerId);
    }

    if (!customer) {
        customer = await Customer.findOne({ "contactInfo.email": user.email });
    }

    if (customer && String(user.customerId || "") !== String(customer._id)) {
        user.customerId = customer._id;
        await user.save();
    }

    const payload = buildCustomerPayload(user, customer);
    const token = signAuthToken({
        id: user._id,
        customerId: payload.customerId,
        role: user.role,
        type: "customer",
    });

    return { token, user: payload };
};

/**
 * Customer Login
 */
export const loginCustomer = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email, role: "customer" });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "This account uses Google sign-in",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const session = await issueCustomerSession(user);

        return res.status(200).json({
            success: true,
            ...session,
        });
    } catch (error) {
        console.error("Customer login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Staff/Admin Login
 */
export const loginStaff = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        let user = await Staff.findOne({ email });
        let isStaffRecord = Boolean(user);

        if (!user) {
            user = await User.findOne({ email, role: "admin" });
            isStaffRecord = false;
        }

        if (!user || (isStaffRecord && !user.isActive)) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const payload = buildStaffPayload(user);
        const token = signAuthToken({
            id: user._id,
            role: user.role,
            type: "staff",
        });

        return res.status(200).json({
            success: true,
            token,
            user: payload,
        });
    } catch (error) {
        console.error("Staff login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const getCurrentSession = async (req, res) => {
    try {
        if (req.user?.type === "staff") {
            const user = await getStaffAccountByToken(req.user);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or inactive staff session",
                });
            }

            return res.status(200).json({
                success: true,
                user: buildStaffPayload(user),
            });
        }

        if (req.user?.type === "customer") {
            const user = await User.findOne({ _id: req.user.id, role: "customer" });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid customer session",
                });
            }

            let customer = null;
            if (user.customerId) {
                customer = await Customer.findById(user.customerId);
            }

            if (!customer) {
                customer = await Customer.findOne({ "contactInfo.email": user.email });
            }

            return res.status(200).json({
                success: true,
                user: buildCustomerPayload(user, customer),
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid session",
        });
    } catch (error) {
        console.error("Get current session error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Customer Registration
 */
export const registerCustomer = async (req, res) => {
    try {
        const name = cleanString(req.body.name, 120);
        const email = normalizeEmail(req.body.email);
        const phone = cleanString(req.body.phone, 30);
        const address = cleanString(req.body.address, 500);
        const { password } = req.body;

        if (!name || !email || !phone || !address || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, phone, address, and password are required",
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and include a letter and a number",
            });
        }

        const [existingUser, existingStaff] = await Promise.all([
            User.findOne({ email }),
            Staff.findOne({ email }),
        ]);

        if (existingUser || existingStaff) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        const customer = await getOrCreateCustomerProfile({ name, email, phone, address });
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const newUser = await User.create({
            name,
            email,
            phone,
            address,
            password: hashedPassword,
            role: "customer",
            customerId: customer._id,
        });

        const session = await issueCustomerSession(newUser);
        const verificationEmailSent = await sendRegistrationOtp(newUser);

        return res.status(201).json({
            success: true,
            message: verificationEmailSent
                ? "Registration successful. Verification code sent to your email."
                : "Registration successful, but verification email could not be sent.",
            verificationEmailSent,
            ...session,
        });
    } catch (error) {
        console.error("Registration error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Customer Google Login/Registration
 */
export const googleCustomerAuth = async (req, res) => {
    try {
        const credential = cleanString(req.body.credential, 10_000);

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required",
            });
        }

        const googleProfile = await verifyGoogleIdToken(credential);
        const email = normalizeEmail(googleProfile.email);
        const name = cleanString(googleProfile.name, 120) || email;
        const profileImageUrl = cleanString(googleProfile.picture, 1000);

        const existingStaff = await Staff.findOne({ email });
        if (existingStaff) {
            return res.status(400).json({
                success: false,
                message: "This email belongs to a staff account. Please use staff login.",
            });
        }

        let user = await User.findOne({ email, role: "customer" });

        if (!user) {
            const customer = await getOrCreateCustomerProfile({
                name,
                email,
                phone: "Google account",
                address: "Not provided",
            });

            user = await User.create({
                name,
                email,
                phone: "",
                address: "",
                profileImageUrl,
                role: "customer",
                customerId: customer._id,
                authProvider: "google",
                googleId: googleProfile.googleId,
                emailVerified: true,
            });

        } else {
            if (user.googleId && user.googleId !== googleProfile.googleId) {
                return res.status(401).json({
                    success: false,
                    message: "Google account does not match this email",
                });
            }

            let customer = null;
            if (user.customerId) {
                customer = await Customer.findById(user.customerId);
            }

            if (!customer) {
                customer = await getOrCreateCustomerProfile({
                    name: user.name || name,
                    email,
                    phone: user.phone || "Google account",
                    address: user.address || "Not provided",
                });
                user.customerId = customer._id;
            }

            user.googleId = user.googleId || googleProfile.googleId;
            user.emailVerified = true;
            user.profileImageUrl = user.profileImageUrl || profileImageUrl;
            user.name = user.name || name;
            await user.save();
        }

        const session = await issueCustomerSession(user);

        return res.status(200).json({
            success: true,
            message: "Google authentication successful",
            ...session,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
};

/**
 * Legacy Login (for backward compatibility)
 */
export const Login = async (req, res) => {
    const email = normalizeEmail(req.body.email);

    try {
        const customer = await User.findOne({ email, role: "customer" });
        if (customer) {
            return loginCustomer(req, res);
        }

        return loginStaff(req, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
