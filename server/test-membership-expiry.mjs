import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

const testExpiryMemberships = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Clear existing test customers
        await Customer.deleteMany({ name: /^Test Member/ });

        // Create test customers with different expiry scenarios
        const testData = [
            {
                name: 'Test Member - Expired Yesterday',
                email: `test-expired-${Date.now()}@example.com`,
                expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                status: 'Active',
            },
            {
                name: 'Test Member - Expired 30 Days Ago',
                email: `test-expired-30d-${Date.now()}@example.com`,
                expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                status: 'Active',
            },
            {
                name: 'Test Member - Expires in 5 Days',
                email: `test-expiring-5d-${Date.now()}@example.com`,
                expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                status: 'Active',
            },
            {
                name: 'Test Member - Active',
                email: `test-active-${Date.now()}@example.com`,
                expiresAt: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000), // 300 days
                status: 'Active',
            },
        ];

        for (const data of testData) {
            const customer = new Customer({
                name: data.name,
                contactInfo: {
                    email: data.email,
                    phone: '555-0000',
                    address: 'Test Address',
                },
                role: 'Member',
                membership: {
                    status: data.status,
                    tier: 'Silver',
                    joinedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
                    approvedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
                    expiresAt: data.expiresAt,
                    pointsBalance: 100,
                    renewalCount: 0,
                },
            });
            await customer.save();
            console.log(`✓ Created: ${data.name}`);
            console.log(`  Email: ${data.email}`);
            console.log(`  Expires: ${data.expiresAt.toLocaleDateString()}`);
        }

        console.log('\n✓ Test customers created successfully!');
        console.log('\nNow test by:');
        console.log('1. GET /api/memberships/stats - Check expired count');
        console.log('2. GET /api/memberships/all - Check status transitions');
        console.log('3. Login as a test customer with expired membership');
        console.log('4. Check Admin > Memberships to see auto-expired members');

    } catch (error) {
        console.error('✗ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

testExpiryMemberships();
