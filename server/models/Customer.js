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
        default: "Member",
        required: true
    },
    membership: {
        status: {
            type: String,
            enum: ["None", "Pending", "Active", "Expired", "Suspended", "Rejected"],
            default: "None",
        },
        tier: {
            type: String,
            enum: ["Silver", "Gold", "Platinum"],
            default: "Silver",
        },
        pointsBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        approvedAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            default: () => {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 1);
                return date;
            },
        },
        renewalCount: {
            type: Number,
            default: 0,
            min: 0,
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
