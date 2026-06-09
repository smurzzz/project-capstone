import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactInfo: {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            trim: true
        }
    },
    role: {
        type: String,
        enum: ["Guest", "Member"],
        default: "Guest",
        required: true
    },
    membership: {
        status: {
            type: String,
            enum: ["None", "Pending", "Active", "Rejected"],
            default: "None",
        },
        tier: {
            type: String,
            trim: true,
            default: "",
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        joinedAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        renewalCount: {
            type: Number,
            default: 0,
        },
    },
    selectedPackageDeal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PackageDeal",
        default: null,
    },
    entryPackage: {
        type: String,
        trim: true,
        default: "None",
    },
    applicationNotes: {
        type: String,
        trim: true,
        default: "",
    },
    applicationSubmittedAt: {
        type: Date,
        default: null,
    },
    membershipPaymentInfo: {
        packageDealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PackageDeal",
            default: null,
        },
        paymentMethod: {
            type: String,
            trim: true,
            default: "",
        },
        referenceNumber: {
            type: String,
            trim: true,
            default: "",
        },
        appliedAt: {
            type: Date,
            default: null,
        },
    },
    profileImageUrl: {
        type: String,
        trim: true
    },
    emailPreferences: {
        enabled: {
            type: Boolean,
            default: true
        },
        appointments: {
            type: Boolean,
            default: true
        },
        orders: {
            type: Boolean,
            default: true
        },
        receipts: {
            type: Boolean,
            default: true
        },
        membership: {
            type: Boolean,
            default: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

customerSchema.index({ role: 1, "membership.status": 1, "membership.tier": 1 });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
