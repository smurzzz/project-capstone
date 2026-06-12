import mongoose from "mongoose";

const DEFAULT_DB_NAME = "jbm-electro-ventures";

const getDatabaseNameFromUri = (uri) => {
    try {
        const parsed = new URL(uri);
        const databaseName = parsed.pathname.replace(/^\/+/, "").trim();
        return databaseName || "";
    } catch {
        return "";
    }
};

const getConnectionConfig = () => {
    const uri = process.env.MONGODB_URI || process.env.URI;

    if (!uri) {
        throw new Error("Missing MongoDB URI. Set MONGODB_URI in server/.env");
    }

    const dbName =
        process.env.MONGODB_DB_NAME ||
        process.env.DB_NAME ||
        getDatabaseNameFromUri(uri) ||
        DEFAULT_DB_NAME;

    return { uri, dbName };
};

const connectDb = async () => {
    try {
        const { uri, dbName } = getConnectionConfig();

        await mongoose.connect(uri, {
            dbName,
            serverSelectionTimeoutMS: 10000,
            autoIndex: process.env.NODE_ENV !== "production",
        });

        if (process.env.NODE_ENV !== "production") {
            console.log(`MongoDB connected to ${mongoose.connection.name}`);
        }
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

export default connectDb
