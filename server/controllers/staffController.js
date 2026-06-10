import Staff from "../models/Staff.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { cleanProfileImage, cleanString, isStrongPassword, normalizeEmail } from "../utils/validation.js";

/**
 * Get all staff (Admin only)
 */
export const getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.find().select("-password");

        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get staff by ID
 */
export const getStaffById = async (req, res) => {
    try {
        const staffMember = await Staff.findById(req.params.id).select("-password");

        if (!staffMember) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        res.status(200).json({
            success: true,
            data: staffMember
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Create new staff member (Admin only)
 */
export const createStaff = async (req, res) => {
    try {
        const name = cleanString(req.body.name, 120);
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;
        const role = cleanString(req.body.role, 20);
        const phone = cleanString(req.body.phone, 30);
        const department = cleanString(req.body.department, 120);
        const profileImageUrl = cleanProfileImage(req.body.profileImageUrl);

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "name, email, password, and role are required"
            });
        }

        if (!["Admin", "Staff"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be Admin or Staff"
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and include a letter and a number"
            });
        }

        // Check if email already exists
        const [existingStaff, existingUser] = await Promise.all([
            Staff.findOne({ email }),
            User.findOne({ email }),
        ]);

        if (existingStaff || existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already in use"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newStaff = new Staff({
            name,
            email,
            password: hashedPassword,
            role,
            phone,
            department,
            profileImageUrl,
            isActive: true
        });

        await newStaff.save();

        res.status(201).json({
            success: true,
            message: "Staff member created successfully",
            data: {
                ...newStaff.toObject(),
                password: undefined
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update staff member
 */
export const updateStaff = async (req, res) => {
    try {
        const name = cleanString(req.body.name, 120);
        const role = cleanString(req.body.role, 20);
        const phone = cleanString(req.body.phone, 30);
        const department = cleanString(req.body.department, 120);
        const profileImageUrl = cleanProfileImage(req.body.profileImageUrl);
        const isActive = Boolean(req.body.isActive);

        if (role && !["Admin", "Staff"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be Admin or Staff"
            });
        }

        const staffMember = await Staff.findByIdAndUpdate(
            req.params.id,
            {
                name,
                role,
                phone,
                department,
                profileImageUrl,
                isActive,
                updatedAt: new Date()
            },
            { new: true }
        ).select("-password");

        if (!staffMember) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Staff member updated successfully",
            data: staffMember
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update staff password
 */
export const updateStaffPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "oldPassword and newPassword are required"
            });
        }

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and include a letter and a number"
            });
        }

        const staffMember = await Staff.findById(req.params.id);

        if (!staffMember) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, staffMember.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        staffMember.password = hashedPassword;
        await staffMember.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update own staff password (authenticated staff)
 */
export const updateOwnPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "oldPassword and newPassword are required"
            });
        }

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters and include a letter and a number"
            });
        }

        const staffMember = await Staff.findById(req.user?.id);

        if (!staffMember) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, staffMember.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Old password is incorrect"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        staffMember.password = hashedPassword;
        await staffMember.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete staff member (Admin only)
 */
export const deleteStaff = async (req, res) => {
    try {
        const staffMember = await Staff.findByIdAndDelete(req.params.id);

        if (!staffMember) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Staff member deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get staff statistics (Admin dashboard)
 */
export const getStaffStats = async (req, res) => {
    try {
        const totalStaff = await Staff.countDocuments();
        const activeStaff = await Staff.countDocuments({ isActive: true });
        const admins = await Staff.countDocuments({ role: "Admin" });
        const staffMembers = await Staff.countDocuments({ role: "Staff" });

        res.status(200).json({
            success: true,
            data: {
                totalStaff,
                activeStaff,
                admins,
                staffMembers
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Deactivate staff member
 */
export const deactivateStaff = async (req, res) => {
    try {
        const staffMember = await Staff.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select("-password");

        if (!staffMember) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Staff member deactivated",
            data: staffMember
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
