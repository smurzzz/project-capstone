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
        enum: ["GCash", "Bank Transfer"],
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
    orderType: {
        type: String,
        enum: ["products", "package", "membership", "regular"],
        default: "products"
    },
    membershipId: {
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

orderSchema.index({ customerId: 1, createdAt: -1 });

orderSchema.virtual("orderId").get(function () {
    if (this.membershipId) {
        return this.membershipId;
    }

    if (this.referenceNumber) {
        return this.referenceNumber;
    }

    const timestamp = this.createdAt || this._id?.getTimestamp?.();
    const date = timestamp ? new Date(timestamp) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const suffix = this._id?.toString().slice(-6).toUpperCase() || "000000";

    return `ORD-${year}${month}${day}-${suffix}`;
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
