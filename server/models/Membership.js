import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true,
    },
    membershipId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Active", "Expired", "Suspended", "Rejected", "Cancelled"],
        default: "Pending",
        required: true,
    },
    tier: {
        type: String,
        trim: true,
        default: "",
    },
    packageDealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PackageDeal",
        default: null,
    },
    packageName: {
        type: String,
        trim: true,
        default: "",
    },
    paymentMethod: {
        type: String,
        trim: true,
        default: "",
    },
    paymentReference: {
        type: String,
        trim: true,
        default: "",
    },
    amount: {
        type: Number,
        default: 0,
        min: 0,
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null,
    },
    notes: {
        type: String,
        trim: true,
        default: "",
    },
    appliedAt: {
        type: Date,
        default: null,
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
}, {
    timestamps: true,
});

membershipSchema.index({ customerId: 1, status: 1, appliedAt: -1 });

const Membership = mongoose.model("Membership", membershipSchema);
export default Membership;
