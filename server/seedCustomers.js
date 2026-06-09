import mongoose from "mongoose";
import dotenv from "dotenv";
import Customer from "./models/Customer.js";

dotenv.config();

const seedCustomers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing customers (optional - comment out to keep existing data)
        // await Customer.deleteMany({});

        const testCustomers = [
            {
                name: "John Doe",
                contactInfo: {
                    email: "john@example.com",
                    phone: "555-0101",
                    address: "123 Main St, City, State",
                },
                role: "Member",
                membership: {
                    status: "Active",
                    tier: "Silver",
                    pointsBalance: 1500,
                    joinedAt: new Date("2024-01-15"),
                    approvedAt: new Date("2024-01-15"),
                    expiresAt: new Date("2025-01-15"),
                    renewalCount: 0,
                },
            },
            {
                name: "Jane Smith",
                contactInfo: {
                    email: "jane@example.com",
                    phone: "555-0102",
                    address: "456 Oak Ave, City, State",
                },
                role: "Member",
                membership: {
                    status: "Active",
                    tier: "Gold",
                    pointsBalance: 3200,
                    joinedAt: new Date("2023-06-20"),
                    approvedAt: new Date("2023-06-20"),
                    expiresAt: new Date("2025-06-20"),
                    renewalCount: 1,
                },
            },
            {
                name: "Sarah Williams",
                contactInfo: {
                    email: "sarah@example.com",
                    phone: "555-0104",
                    address: "321 Elm St, City, State",
                },
                role: "Member",
                membership: {
                    status: "Pending",
                    tier: "Silver",
                    pointsBalance: 0,
                    joinedAt: new Date("2024-11-01"),
                    approvedAt: null,
                    expiresAt: new Date("2025-11-01"),
                    renewalCount: 0,
                },
            },
            {
                name: "Robert Brown",
                contactInfo: {
                    email: "robert@example.com",
                    phone: "555-0105",
                    address: "654 Maple Dr, City, State",
                },
                role: "Member",
                membership: {
                    status: "Active",
                    tier: "Platinum",
                    pointsBalance: 5000,
                    joinedAt: new Date("2022-03-10"),
                    approvedAt: new Date("2022-03-10"),
                    expiresAt: new Date("2025-03-10"),
                    renewalCount: 2,
                },
            },
        ];

        const created = await Customer.insertMany(testCustomers);
        console.log(`✅ Successfully seeded ${created.length} test customers`);

        // Display created customers
        created.forEach((customer) => {
            console.log(`  - ${customer.name} (${customer.contactInfo.email}) - Role: ${customer.role}`);
        });

    } catch (error) {
        console.error("❌ Seed error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

seedCustomers();
