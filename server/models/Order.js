import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },
    fullName: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ""
    },
    address: {
        type: String,
        required: true
    },
    packageDealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PackageDeal",
        default: null
    },
    packageName: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        enum: ["GCash"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "checkout_created", "paid", "failed"],
        default: "pending"
    },
    paymentGateway: {
        type: String,
        trim: true,
        default: "manual"
    },
    paymentReference: {
        type: String,
        trim: true,
        default: ""
    },
    paymentCheckoutUrl: {
        type: String,
        trim: true,
        default: ""
    },
    referenceNumber: {
        type: String,
        unique: true,
        trim: true
    },
    paymentProofUrl: {
        type: String,
        trim: true,
        default: ""
    },
    orderType: {
        type: String,
        enum: ["regular", "membership"],
        default: "regular"
    },
    membershipTier: {
        type: String,
        trim: true,
        default: ""
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    membershipDiscountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    promotionDiscountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    promotionCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: ""
    },
    appliedPromotions: [{
        promotionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Promotion",
        },
        name: {
            type: String,
            trim: true,
        },
        code: {
            type: String,
            trim: true,
            uppercase: true,
            default: "",
        },
        type: {
            type: String,
            trim: true,
        },
        value: {
            type: Number,
            default: 0,
        },
        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
    }],
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
        default: "Pending"
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

orderSchema.index({ customerId: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
