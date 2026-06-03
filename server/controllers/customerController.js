import Customer from "../models/Customer.js";
import User from "../models/User.js";
import MembershipHistory from "../models/MembershipHistory.js";
import {
    cleanString,
    cleanProfileImage,
    isValidObjectId,
    normalizeEmail,
} from "../utils/validation.js";
import { MEMBERSHIP_STATUSES, MEMBERSHIP_TIERS } from "../utils/membership.js";

const defaultMembership = ({ status = "Active", tier = "Silver" } = {}) => {
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

const mapCustomerInput = (body) => {
    const contactInfo = body.contactInfo || {};
    const tier = MEMBERSHIP_TIERS[body.membership?.tier] ? body.membership.tier : "Silver";
    const status = MEMBERSHIP_STATUSES.includes(body.membership?.status)
        ? body.membership.status
        : body.role === "Guest" ? "Pending" : "Active";

    return {
        name: cleanString(body.name, 120),
        contactInfo: {
            email: normalizeEmail(contactInfo.email),
            phone: cleanString(contactInfo.phone, 30),
            address: cleanString(contactInfo.address, 500),
        },
        role: ["Guest", "Member"].includes(body.role) ? body.role : "Member",
        membership: defaultMembership({ status, tier }),
        profileImageUrl: cleanProfileImage(body.profileImageUrl),
    };
};

const recordMembershipHistory = (payload) => MembershipHistory.create(payload);

/**
 * Get all customers (Staff/Admin only)
 */
export const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: customers,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get authenticated customer profile
 */
export const getCurrentCustomer = async (req, res) => {
    try {
        if (req.user?.type !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Customer account required",
            });
        }

        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const customer = user.customerId
            ? await Customer.findById(user.customerId)
            : await Customer.findOne({ "contactInfo.email": user.email });

        res.status(200).json({
            success: true,
            data: {
                user,
                customer,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update authenticated customer profile
 */
export const updateCurrentCustomer = async (req, res) => {
    try {
        if (req.user?.type !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Customer account required",
            });
        }

        const name = cleanString(req.body.name, 120);
        const phone = cleanString(req.body.phone, 30);
        const address = cleanString(req.body.address, 500);
        const profileImageUrl = cleanProfileImage(req.body.profileImageUrl);

        if (!name || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: "Name, phone, and address are required",
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        user.name = name;
        user.phone = phone;
        user.address = address;
        user.profileImageUrl = profileImageUrl;

        let customer = user.customerId
            ? await Customer.findById(user.customerId)
            : await Customer.findOne({ "contactInfo.email": user.email });

        if (!customer) {
            customer = await Customer.create({
                name,
                contactInfo: {
                    email: user.email,
                    phone,
                    address,
                },
                profileImageUrl,
                role: "Member",
                membership: defaultMembership(),
            });
            user.customerId = customer._id;
            await recordMembershipHistory({
                customerId: customer._id,
                action: "registered",
                newStatus: customer.membership.status,
                newTier: customer.membership.tier,
                actorType: "customer",
                actorId: user._id,
                notes: "Customer profile created from account settings",
            });
        } else {
            customer.name = name;
            customer.contactInfo.phone = phone;
            customer.contactInfo.address = address;
            customer.profileImageUrl = profileImageUrl;
            customer.role = "Member";
            customer.membership = customer.membership || defaultMembership();
            customer.updatedAt = new Date();
            await customer.save();
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: {
                id: user._id,
                customerId: customer._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                profileImageUrl: user.profileImageUrl || "",
                role: user.role,
                memberRole: customer.role,
                type: "customer",
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get customer by email
 */
export const getCustomerByEmail = async (req, res) => {
    try {
        const email = normalizeEmail(req.params.email);
        const customer = await Customer.findOne({ "contactInfo.email": email });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Create new customer
 */
export const createCustomer = async (req, res) => {
    try {
        const payload = mapCustomerInput(req.body);

        if (!payload.name || !payload.contactInfo.email || !payload.contactInfo.phone) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and phone are required",
            });
        }

        const existingCustomer = await Customer.findOne({
            "contactInfo.email": payload.contactInfo.email,
        });

        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        const newCustomer = await Customer.create(payload);
        await recordMembershipHistory({
            customerId: newCustomer._id,
            action: "registered",
            newStatus: newCustomer.membership.status,
            newTier: newCustomer.membership.tier,
            actorType: req.user?.type || "staff",
            actorId: req.user?.id || null,
            notes: "Customer record created by staff",
        });

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: newCustomer,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update customer membership status, tier, expiration, and points
 */
export const updateMembership = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const status = MEMBERSHIP_STATUSES.includes(req.body.status)
            ? req.body.status
            : customer.membership?.status || "Active";
        const tier = MEMBERSHIP_TIERS[req.body.tier]
            ? req.body.tier
            : customer.membership?.tier || "Silver";
        const pointsAdjustment = Number(req.body.pointsAdjustment || 0);
        const notes = cleanString(req.body.notes, 500);
        const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : customer.membership?.expiresAt;

        if (req.body.expiresAt && Number.isNaN(expiresAt.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid expiration date",
            });
        }

        const previousStatus = customer.membership?.status || "";
        const previousTier = customer.membership?.tier || "";
        const previousPoints = customer.membership?.pointsBalance || 0;
        const nextPoints = Math.max(0, previousPoints + pointsAdjustment);
        const isApproval = previousStatus !== "Active" && status === "Active";

        customer.role = "Member";
        customer.membership = {
            ...(customer.membership?.toObject ? customer.membership.toObject() : customer.membership || defaultMembership()),
            status,
            tier,
            pointsBalance: nextPoints,
            approvedAt: isApproval ? new Date() : customer.membership?.approvedAt,
            expiresAt,
            renewalCount: req.body.renew === true
                ? (customer.membership?.renewalCount || 0) + 1
                : customer.membership?.renewalCount || 0,
        };
        customer.updatedAt = new Date();
        await customer.save();

        await recordMembershipHistory({
            customerId: customer._id,
            action: isApproval ? "approved" : req.body.renew === true ? "renewed" : "updated",
            previousStatus,
            newStatus: status,
            previousTier,
            newTier: tier,
            pointsChange: nextPoints - previousPoints,
            actorType: req.user?.type || "staff",
            actorId: req.user?.id || null,
            notes,
        });

        res.status(200).json({
            success: true,
            message: "Membership updated successfully",
            data: customer,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get customer membership history
 */
export const getMembershipHistory = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

        const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
        const history = await MembershipHistory.find({ customerId: req.params.id })
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            data: history,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update customer
 */
export const updateCustomer = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

        const payload = mapCustomerInput(req.body);

        if (!payload.name || !payload.contactInfo.email || !payload.contactInfo.phone) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and phone are required",
            });
        }

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            {
                ...payload,
                updatedAt: new Date(),
            },
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            data: customer,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Delete customer
 */
export const deleteCustomer = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

        const customer = await Customer.findByIdAndDelete(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get customer count (Dashboard stats)
 */
export const getCustomerStats = async (req, res) => {
    try {
        const [totalCustomers, members, guests] = await Promise.all([
            Customer.countDocuments(),
            Customer.countDocuments({ role: "Member" }),
            Customer.countDocuments({ role: "Guest" }),
        ]);
        const membershipByTier = await Customer.aggregate([
            { $match: { role: "Member" } },
            {
                $group: {
                    _id: {
                        tier: "$membership.tier",
                        status: "$membership.status",
                    },
                    count: { $sum: 1 },
                    points: { $sum: "$membership.pointsBalance" },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalCustomers,
                members,
                guests,
                membershipByTier,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Get email preferences for authenticated customer
 */
export const getEmailPreferences = async (req, res) => {
    try {
        if (req.user?.type !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Customer account required",
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const customer = user.customerId
            ? await Customer.findById(user.customerId)
            : await Customer.findOne({ "contactInfo.email": user.email });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found",
            });
        }

        res.status(200).json({
            success: true,
            data: {
                enabled: customer.emailPreferences?.enabled ?? true,
                appointments: customer.emailPreferences?.appointments ?? true,
                orders: customer.emailPreferences?.orders ?? true,
                receipts: customer.emailPreferences?.receipts ?? true,
                membership: customer.emailPreferences?.membership ?? true,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/**
 * Update email preferences for authenticated customer
 */
export const updateEmailPreferences = async (req, res) => {
    try {
        if (req.user?.type !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Customer account required",
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        let customer = user.customerId
            ? await Customer.findById(user.customerId)
            : await Customer.findOne({ "contactInfo.email": user.email });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found",
            });
        }

        customer.emailPreferences = {
            enabled: req.body.enabled !== false,
            appointments: req.body.appointments !== false,
            orders: req.body.orders !== false,
            receipts: req.body.receipts !== false,
            membership: req.body.membership !== false,
        };

        user.emailNotificationsEnabled = req.body.enabled !== false;

        await Promise.all([customer.save(), user.save()]);

        res.status(200).json({
            success: true,
            message: "Email preferences updated successfully",
            data: customer.emailPreferences,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

