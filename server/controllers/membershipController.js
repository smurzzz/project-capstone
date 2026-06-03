import Customer from "../models/Customer.js";
import MembershipHistory from "../models/MembershipHistory.js";
import User from "../models/User.js";
import { cleanString, isValidObjectId } from "../utils/validation.js";
import { sendMembershipApprovalEmail } from "../utils/emailService.js";

const getAuthenticatedAccount = async (tokenUser) => {
    const account = await User.findById(tokenUser?.id || tokenUser?._id);
    return account?.role === "customer" ? account : null;
};

const getCustomerForAccount = async (account) => {
    if (!account) return null;

    let customer = account.customerId ? await Customer.findById(account.customerId) : null;

    if (!customer) {
        customer = await Customer.findOne({ "contactInfo.email": account.email });
    }

    if (customer && String(account.customerId || "") !== String(customer._id)) {
        account.customerId = customer._id;
        await account.save();
    }

    return customer;
};

/**
 * Customer: Apply for membership
 */
export const applyForMembership = async (req, res) => {
    try {
        const { fullName, email, phone, address, membershipType, additionalNotes } = req.body;
        const account = await getAuthenticatedAccount(req.user);

        if (!account) {
            return res.status(403).json({
                success: false,
                message: "Customer account required"
            });
        }

        // Validate required fields
        if (!fullName || !email || !phone || !address || !membershipType) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Get or update the customer profile attached to this account.
        let customer = await getCustomerForAccount(account);

        if (!customer) {
            customer = new Customer({
                name: cleanString(fullName, 120),
                contactInfo: {
                    email: email.toLowerCase().trim(),
                    phone: cleanString(phone, 30),
                    address: cleanString(address, 500)
                },
                role: 'Member',
                membership: {
                    status: 'Pending',
                    tier: membershipType,
                    pointsBalance: 0,
                    joinedAt: new Date()
                }
            });
        } else {
            customer.name = cleanString(fullName, 120);
            customer.contactInfo.email = account.email;
            customer.contactInfo.phone = cleanString(phone, 30);
            customer.contactInfo.address = cleanString(address, 500);
            customer.role = 'Member';
            customer.membership = {
                status: 'Pending',
                tier: membershipType,
                pointsBalance: customer.membership?.pointsBalance || 0,
                joinedAt: new Date()
            };
        }

        // Handle file upload if present
        if (req.file) {
            // Store the file path or URL
            customer.idDocument = req.file.path || `uploads/${req.file.filename}`;
        }

        // Store additional metadata
        customer.applicationNotes = additionalNotes || '';
        customer.applicationSubmittedAt = new Date();

        await customer.save();

        if (String(account.customerId || "") !== String(customer._id)) {
            account.customerId = customer._id;
            await account.save();
        }

        // Record membership history
        await MembershipHistory.create({
            customerId: customer._id,
            action: 'registered',
            previousStatus: '',
            newStatus: 'Pending',
            previousTier: '',
            newTier: membershipType,
            actorType: 'customer',
            actorId: account._id,
            notes: `Applied for ${membershipType} membership`
        });

        res.status(201).json({
            success: true,
            message: 'Membership application submitted successfully',
            data: {
                customerId: customer._id,
                status: 'Pending',
                tier: membershipType
            }
        });
    } catch (error) {
        console.error('Error applying for membership:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit membership application'
        });
    }
};

/**
 * Customer: Get their membership status
 */
export const getMyMembership = async (req, res) => {
    try {
        const account = await getAuthenticatedAccount(req.user);
        const customer = await getCustomerForAccount(account);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                membership: customer.membership
            }
        });
    } catch (error) {
        console.error('Error fetching membership:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch membership information'
        });
    }
};

/**
 * Customer: Get membership history
 */
export const getMyMembershipHistory = async (req, res) => {
    try {
        const account = await getAuthenticatedAccount(req.user);
        const customer = await getCustomerForAccount(account);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        const history = await MembershipHistory.find({ customerId: customer._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: {
                history
            }
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch membership history'
        });
    }
};

/**
 * Admin: Get all membership applications
 */
export const getAllApplications = async (req, res) => {
    try {
        const { status, tier, search } = req.query;
        const filter = {};

        if (status) filter['membership.status'] = status;
        if (tier) filter['membership.tier'] = tier;

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'contactInfo.email': { $regex: search, $options: 'i' } },
                { 'contactInfo.phone': { $regex: search, $options: 'i' } }
            ];
        }

        const applications = await Customer.find(filter)
            .select('name contactInfo membership applicationSubmittedAt applicationNotes _id')
            .sort({ applicationSubmittedAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                applications
            }
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications'
        });
    }
};

/**
 * Admin: Get single application details
 */
export const getApplicationById = async (req, res) => {
    try {
        const { applicationId } = req.params;

        if (!isValidObjectId(applicationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID'
            });
        }

        const application = await Customer.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                application
            }
        });
    } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application'
        });
    }
};

/**
 * Admin: Approve membership application
 */
export const approveApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { notes, tier } = req.body;
        const staffId = req.user._id;

        if (!isValidObjectId(applicationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID'
            });
        }

        const customer = await Customer.findById(applicationId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const previousStatus = customer.membership.status;
        const previousTier = customer.membership.tier;

        // Update customer membership
        customer.membership.status = 'Active';
        customer.membership.tier = tier || customer.membership.tier;
        customer.membership.approvedAt = new Date();

        if (!customer.membership.joinedAt) {
            customer.membership.joinedAt = new Date();
        }

        // Set expiration date (1 year from approval)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        customer.membership.expiresAt = expiresAt;

        customer.role = 'Member';

        await customer.save();

        // Record history
        await MembershipHistory.create({
            customerId: customer._id,
            action: 'approved',
            previousStatus,
            newStatus: 'Active',
            previousTier,
            newTier: customer.membership.tier,
            actorType: 'staff',
            actorId: staffId,
            notes: notes || `Membership approved to ${customer.membership.tier} tier`
        });

        await sendMembershipApprovalEmail({
            to: customer.contactInfo?.email,
            name: customer.name,
            tier: customer.membership.tier,
            expiresAt: customer.membership.expiresAt,
        });

        res.status(200).json({
            success: true,
            message: 'Application approved successfully',
            data: {
                customerId: customer._id,
                status: 'Active',
                tier: customer.membership.tier
            }
        });
    } catch (error) {
        console.error('Error approving application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve application'
        });
    }
};

/**
 * Admin: Reject membership application
 */
export const rejectApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { reason } = req.body;
        const staffId = req.user._id;

        if (!isValidObjectId(applicationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID'
            });
        }

        const customer = await Customer.findById(applicationId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const previousStatus = customer.membership.status;

        customer.membership.status = 'Rejected';
        await customer.save();

        // Record history
        await MembershipHistory.create({
            customerId: customer._id,
            action: 'rejected',
            previousStatus,
            newStatus: 'Rejected',
            actorType: 'staff',
            actorId: staffId,
            notes: reason || 'Application rejected'
        });

        // TODO: Send email notification to customer

        res.status(200).json({
            success: true,
            message: 'Application rejected',
            data: {
                customerId: customer._id,
                status: 'Rejected'
            }
        });
    } catch (error) {
        console.error('Error rejecting application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject application'
        });
    }
};

/**
 * Admin: Renew membership
 */
export const renewMembership = async (req, res) => {
    try {
        const { customerId } = req.params;
        const staffId = req.user._id;

        if (!isValidObjectId(customerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID'
            });
        }

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        customer.membership.expiresAt = expiresAt;
        customer.membership.renewalCount = (customer.membership.renewalCount || 0) + 1;

        if (customer.membership.status !== 'Active') {
            customer.membership.status = 'Active';
            customer.membership.approvedAt = new Date();
        }

        await customer.save();

        // Record history
        await MembershipHistory.create({
            customerId: customer._id,
            action: 'renewed',
            newStatus: customer.membership.status,
            newTier: customer.membership.tier,
            actorType: 'staff',
            actorId: staffId,
            notes: `Membership renewed until ${expiresAt.toLocaleDateString()}`
        });

        res.status(200).json({
            success: true,
            message: 'Membership renewed successfully',
            data: {
                expiresAt: customer.membership.expiresAt,
                renewalCount: customer.membership.renewalCount
            }
        });
    } catch (error) {
        console.error('Error renewing membership:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to renew membership'
        });
    }
};

/**
 * Admin: Update membership tier
 */
export const updateMembershipTier = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { tier } = req.body;
        const staffId = req.user._id;

        if (!isValidObjectId(customerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID'
            });
        }

        if (!['Silver', 'Gold', 'Platinum'].includes(tier)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid membership tier'
            });
        }

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const previousTier = customer.membership.tier;
        customer.membership.tier = tier;

        await customer.save();

        // Record history
        await MembershipHistory.create({
            customerId: customer._id,
            action: 'updated',
            previousTier,
            newTier: tier,
            actorType: 'staff',
            actorId: staffId,
            notes: `Membership tier updated from ${previousTier} to ${tier}`
        });

        res.status(200).json({
            success: true,
            message: 'Membership tier updated successfully',
            data: {
                tier: customer.membership.tier
            }
        });
    } catch (error) {
        console.error('Error updating tier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update membership tier'
        });
    }
};

/**
 * Admin: Suspend membership
 */
export const suspendMembership = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { reason } = req.body;
        const staffId = req.user._id;

        if (!isValidObjectId(customerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID'
            });
        }

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const previousStatus = customer.membership.status;
        customer.membership.status = 'Suspended';

        await customer.save();

        // Record history
        await MembershipHistory.create({
            customerId: customer._id,
            action: 'suspended',
            previousStatus,
            newStatus: 'Suspended',
            actorType: 'staff',
            actorId: staffId,
            notes: reason || 'Membership suspended'
        });

        res.status(200).json({
            success: true,
            message: 'Membership suspended',
            data: {
                status: 'Suspended'
            }
        });
    } catch (error) {
        console.error('Error suspending membership:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to suspend membership'
        });
    }
};

/**
 * Admin: Get membership statistics
 */
export const getMembershipStats = async (req, res) => {
    try {
        const stats = {
            totalMembers: await Customer.countDocuments({ 'membership.status': { $in: ['Active', 'Approved'] } }),
            pending: await Customer.countDocuments({ 'membership.status': 'Pending' }),
            approved: await Customer.countDocuments({ 'membership.status': 'Approved' }),
            active: await Customer.countDocuments({ 'membership.status': 'Active' }),
            rejected: await Customer.countDocuments({ 'membership.status': 'Rejected' }),
            expired: await Customer.countDocuments({ 'membership.status': 'Expired' }),
            suspended: await Customer.countDocuments({ 'membership.status': 'Suspended' }),
            byTier: {
                silver: await Customer.countDocuments({ 'membership.tier': 'Silver' }),
                gold: await Customer.countDocuments({ 'membership.tier': 'Gold' }),
                platinum: await Customer.countDocuments({ 'membership.tier': 'Platinum' })
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch membership statistics'
        });
    }
};

export default {
    applyForMembership,
    getMyMembership,
    getMyMembershipHistory,
    getAllApplications,
    getApplicationById,
    approveApplication,
    rejectApplication,
    renewMembership,
    updateMembershipTier,
    suspendMembership,
    getMembershipStats
};
