import Customer from "../models/Customer.js";
import Membership from "../models/Membership.js";
import MembershipHistory from "../models/MembershipHistory.js";
import Order from "../models/Order.js";
import PackageDeal from "../models/PackageDeal.js";
import User from "../models/User.js";
import { cleanString, isValidObjectId } from "../utils/validation.js";
import { sendMembershipApprovalEmail } from "../utils/emailService.js";
import { getExpiryDate, expireActiveMemberships } from "../utils/membership.js";
import { handleControllerError } from "../utils/errorResponse.js";
import logger from "../utils/logger.js";

const buildMembershipOrderReference = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `ORD-${year}${month}${day}-${suffix}`;
};

const buildMembershipId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `MEM-${year}${month}${day}-${suffix}`;
};

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
        const { fullName, email, contactNumber, address, packageName, packageDealId, paymentMethod, referenceNumber, additionalInfo } = req.body;
        const account = await getAuthenticatedAccount(req.user);

        if (!account) {
            return res.status(403).json({
                success: false,
                message: "Customer account required"
            });
        }

        // Validate required fields
        if (!fullName || !email || !contactNumber || !address || !packageName) {
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
                    phone: cleanString(contactNumber, 30),
                    address: cleanString(address, 500)
                },
                role: 'Guest',
                membership: {
                    status: 'Pending',
                    tier: cleanString(packageName, 160)
                },
                selectedPackageDeal: packageDealId || null,
                entryPackage: cleanString(packageName, 160),
                applicationNotes: `Applied for ${cleanString(packageName, 160)} membership`,
            });
        } else {
            customer.name = cleanString(fullName, 120);
            customer.contactInfo.email = email.toLowerCase().trim();
            customer.contactInfo.phone = cleanString(contactNumber, 30);
            customer.contactInfo.address = cleanString(address, 500);
            customer.role = customer.role === 'Member' ? 'Member' : 'Guest';
            customer.membership = {
                status: 'Pending',
                tier: cleanString(packageName, 160)
            };
            customer.selectedPackageDeal = packageDealId || null;
            customer.entryPackage = cleanString(packageName, 160);
            customer.applicationNotes = `Applied for ${cleanString(packageName, 160)} membership`;
        }

        // Store payment information
        customer.membershipPaymentInfo = {
            packageDealId,
            paymentMethod: paymentMethod || '',
            referenceNumber: referenceNumber || '',
            appliedAt: new Date()
        };

        // File uploads require manual verification; store path for staff to review
        // during application approval process
        if (req.file) {
            // Store the file path or URL
            customer.idDocument = req.file.path || `uploads/${req.file.filename}`;
        }

        // Store application metadata
        customer.applicationSubmittedAt = new Date();

        await customer.save();

        // Create membership record for the application
        let membershipRecord = null;
        const membershipId = buildMembershipId();
        let packagePrice = 0;
        let packageDeal = null;

        if (packageDealId && isValidObjectId(packageDealId)) {
            packageDeal = await PackageDeal.findById(packageDealId);
            packagePrice = packageDeal?.price || 0;
        }

        const paymentReference = referenceNumber || "";
        const orderReference = buildMembershipOrderReference();
        const orderNotes = additionalInfo
            ? `Package: ${packageName} | Additional Info: ${additionalInfo}`
            : `Package: ${packageName}`;

        try {
            membershipRecord = await Membership.create({
                customerId: customer._id,
                membershipId,
                status: 'Pending',
                tier: cleanString(packageName, 160),
                packageDealId: packageDeal?._id || null,
                packageName,
                paymentMethod: paymentMethod || '',
                paymentReference,
                amount: packagePrice,
                notes: orderNotes,
                appliedAt: new Date(),
            });
        } catch (membershipError) {
            logger.error('Membership.createRecord', membershipError);
        }

        // Create a membership order record so the application appears in order management
        let membershipOrder = null;
        try {
            membershipOrder = await Order.create({
                customerId: customer._id,
                fullName: customer.name,
                contactNumber: customer.contactInfo.phone,
                email: customer.contactInfo.email,
                address: customer.contactInfo.address || '',
                packageDealId: packageDeal?._id || null,
                packageName,
                paymentMethod: paymentMethod || '',
                paymentStatus: 'pending',
                paymentGateway: paymentMethod === 'GCash' ? 'gcash' : paymentMethod === 'Bank Transfer' ? 'bank_transfer' : 'manual',
                paymentReference,
                paymentCheckoutUrl: '',
                referenceNumber: orderReference,
                membershipId,
                orderType: 'membership',
                total: packagePrice,
                discountAmount: 0,
                membershipDiscountAmount: 0,
                promotionDiscountAmount: 0,
                promotionCode: '',
                appliedPromotions: [],
                notes: orderNotes,
                status: 'Pending',
            });

            if (membershipRecord) {
                membershipRecord.orderId = membershipOrder._id;
                await membershipRecord.save();
            }
        } catch (orderError) {
            logger.error('Membership.createOrder', orderError);
        }

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
            newTier: packageName,
            actorType: 'customer',
            actorId: account._id,
            notes: `Applied for ${packageName} membership via application form`
        });

        res.status(201).json({
            success: true,
            message: 'Membership application submitted successfully',
            data: {
                customerId: customer._id,
                membershipId: membershipRecord?.membershipId || null,
                status: 'Pending',
                tier: packageName,
                order: membershipOrder ? {
                    id: membershipOrder._id,
                    orderId: membershipOrder.orderId,
                    membershipId: membershipOrder.membershipId,
                    referenceNumber: membershipOrder.referenceNumber,
                    paymentMethod: membershipOrder.paymentMethod,
                    paymentStatus: membershipOrder.paymentStatus,
                    total: membershipOrder.total,
                } : null
            }
        });
    } catch (error) {
        handleControllerError(res, error, 'Membership.applyForMembership', 500, 'Failed to submit membership application');
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

        const selectedPackageDeal = customer.selectedPackageDeal
            ? await PackageDeal.findById(customer.selectedPackageDeal).select('name price description')
            : null;

        const membershipOrder = await Order.findOne({ customerId: customer._id, orderType: 'membership' })
            .sort({ createdAt: -1 });
        const membershipRecord = await Membership.findOne({ customerId: customer._id })
            .sort({ appliedAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                membership: customer.membership,
                membershipRecord: membershipRecord ? {
                    membershipId: membershipRecord.membershipId,
                    status: membershipRecord.status,
                    tier: membershipRecord.tier,
                    packageName: membershipRecord.packageName,
                    paymentMethod: membershipRecord.paymentMethod,
                    paymentReference: membershipRecord.paymentReference,
                    amount: membershipRecord.amount,
                    appliedAt: membershipRecord.appliedAt,
                    approvedAt: membershipRecord.approvedAt,
                    joinedAt: membershipRecord.joinedAt,
                    expiresAt: membershipRecord.expiresAt,
                    orderId: membershipRecord.orderId,
                } : null,
                selectedPackageDeal,
                entryPackage: customer.entryPackage,
                membershipPaymentInfo: customer.membershipPaymentInfo,
                applicationSubmittedAt: customer.applicationSubmittedAt,
                applicationNotes: customer.applicationNotes,
                status: customer.membership.status,
                order: membershipOrder ? {
                    id: membershipOrder._id,
                    orderId: membershipOrder.orderId,
                    membershipId: membershipOrder.membershipId,
                    referenceNumber: membershipOrder.referenceNumber,
                    paymentMethod: membershipOrder.paymentMethod,
                    paymentStatus: membershipOrder.paymentStatus,
                    total: membershipOrder.total,
                } : null,
            }
        });
    } catch (error) {
        handleControllerError(res, error, 'Membership.getMyMembership', 500, 'Failed to fetch membership information');
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
        handleControllerError(res, error, 'Membership.getMyMembershipHistory', 500, 'Failed to fetch membership history');
    }
};

/**
 * Admin: Get all membership applications
 */
export const getAllApplications = async (req, res) => {
    try {
        await expireActiveMemberships();
        const { status, tier, search } = req.query;
        const filter = {};

        if (status) {
            filter['membership.status'] = status;
        } else {
            // Hide customers without an active or pending membership application by default
            filter['membership.status'] = { $ne: 'None' };
        }

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
        handleControllerError(res, error, 'Membership.getAllApplications', 500, 'Failed to fetch applications');
    }
};

/**
 * Admin: Get single application details
 */
export const getApplicationById = async (req, res) => {
    try {
        await expireActiveMemberships();
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
        handleControllerError(res, error, 'Membership.getApplicationById', 500, 'Failed to fetch application');
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

        const activationDate = customer.membership.joinedAt
            ? new Date(customer.membership.joinedAt)
            : new Date();
        customer.membership.joinedAt = customer.membership.joinedAt || activationDate;
        customer.membership.expiresAt = getExpiryDate(activationDate);
        customer.role = 'Member';

        await customer.save();

        const membershipRecord = await Membership.findOne({ customerId: customer._id })
            .sort({ appliedAt: -1 });
        if (membershipRecord) {
            membershipRecord.status = 'Active';
            membershipRecord.tier = customer.membership.tier;
            membershipRecord.approvedAt = customer.membership.approvedAt;
            membershipRecord.joinedAt = customer.membership.joinedAt;
            membershipRecord.expiresAt = customer.membership.expiresAt;
            membershipRecord.renewalCount = customer.membership.renewalCount || membershipRecord.renewalCount;
            await membershipRecord.save();
        }

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
        handleControllerError(res, error, 'Membership.approveApplication', 500, 'Failed to approve application');
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

        const membershipRecord = await Membership.findOne({ customerId: customer._id })
            .sort({ appliedAt: -1 });
        if (membershipRecord) {
            membershipRecord.status = 'Rejected';
            membershipRecord.notes = reason || membershipRecord.notes;
            await membershipRecord.save();
        }

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

        res.status(200).json({
            success: true,
            message: 'Application rejected',
            data: {
                customerId: customer._id,
                status: 'Rejected'
            }
        });
    } catch (error) {
        handleControllerError(res, error, 'Membership.rejectApplication', 500, 'Failed to reject application');
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

        const expiresAt = getExpiryDate(new Date());

        customer.membership.expiresAt = expiresAt;
        customer.membership.renewalCount = (customer.membership.renewalCount || 0) + 1;

        if (customer.membership.status !== 'Active') {
            customer.membership.status = 'Active';
            customer.membership.approvedAt = new Date();
        }

        await customer.save();

        const membershipRecord = await Membership.findOne({ customerId: customer._id })
            .sort({ appliedAt: -1 });
        if (membershipRecord) {
            membershipRecord.status = customer.membership.status;
            membershipRecord.expiresAt = expiresAt;
            membershipRecord.renewalCount = customer.membership.renewalCount;
            await membershipRecord.save();
        }

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
        handleControllerError(res, error, 'Membership.renewMembership', 500, 'Failed to renew membership');
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

        const membershipRecord = await Membership.findOne({ customerId: customer._id })
            .sort({ appliedAt: -1 });
        if (membershipRecord) {
            membershipRecord.tier = tier;
            await membershipRecord.save();
        }

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
        handleControllerError(res, error, 'Membership.updateMembershipTier', 500, 'Failed to update membership tier');
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

        const membershipRecord = await Membership.findOne({ customerId: customer._id })
            .sort({ appliedAt: -1 });
        if (membershipRecord) {
            membershipRecord.status = 'Suspended';
            membershipRecord.notes = reason || membershipRecord.notes;
            await membershipRecord.save();
        }

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
        handleControllerError(res, error, 'Membership.suspendMembership', 500, 'Failed to suspend membership');
    }
};

/**
 * Admin: Get membership statistics
 */
export const getMembershipStats = async (req, res) => {
    try {
        await expireActiveMemberships();
        const stats = {
            totalMembers: await Customer.countDocuments({ 'membership.status': { $in: ['Active', 'Approved'] } }),
            pending: await Customer.countDocuments({ 'membership.status': 'Pending' }),
            approved: await Customer.countDocuments({ 'membership.status': 'Approved' }),
            active: await Customer.countDocuments({ 'membership.status': 'Active' }),
            rejected: await Customer.countDocuments({ 'membership.status': 'Rejected' }),
            expired: await Customer.countDocuments({ 'membership.status': 'Expired' }),
            suspended: await Customer.countDocuments({ 'membership.status': 'Suspended' }),
            cancelled: await Customer.countDocuments({
                'membership.status': 'None',
                applicationSubmittedAt: { $exists: true, $ne: null }
            }),
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
        handleControllerError(res, error, 'Membership.getMembershipStats', 500, 'Failed to fetch membership statistics');
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
