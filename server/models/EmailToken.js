import mongoose from "mongoose";

const emailTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    purpose: {
        type: String,
        enum: ["otp_verification", "password_reset"],
        required: true,
        index: true,
    },
    tokenHash: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
    },
    usedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

emailTokenSchema.index({ email: 1, purpose: 1, createdAt: -1 });

const EmailToken = mongoose.model("EmailToken", emailTokenSchema);
export default EmailToken;
