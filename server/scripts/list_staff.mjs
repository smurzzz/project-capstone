import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDb from "../db/connect.js";
import Staff from "../models/Staff.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

const run = async () => {
    try {
        await connectDb();
        const staff = await Staff.find({}, { email: 1, role: 1, isActive: 1, createdAt: 1 }).lean();
        console.log(JSON.stringify(staff, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("MongoDB connection failed:", err.message || err);
        process.exit(1);
    }
};

run();
