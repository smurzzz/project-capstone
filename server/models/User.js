import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function requirePasswordForPasswordAuth() {
            return this.authProvider !== "google";
        }
    },
    authProvider: {
        type: String,
        enum: ["password", "google"],
        default: "password"
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    profileImageUrl: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ["admin", "customer"],
        default: "customer"
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null
    },
    emailNotificationsEnabled: {
        type: Boolean,
        default: true
    },
    membershipStatus: {
        type: String,
        enum: ["inactive", "pending", "active"],
        default: "inactive"
    },
    membershipPackage: {
        type: String,
        trim: true,
        default: ""
    },
    membershipTier: {
        type: String,
        trim: true,
        default: ""
    },
    membershipActivatedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

const User = mongoose.model("User",  userSchema)
export default User
