import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

const testMembershipExpiry = async () => {
    try {
        await mongoose.connect(process.env.URI || process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Clear old test data
        await Customer.deleteMany({ name: /^TEST-/ });
        console.log('✓ Cleared old test data\n');

        const now = new Date();
        
        const testCustomers = [
            {
                name: 'TEST-EXPIRED-YESTERDAY',
                email: `test-expired-${Date.now()}@test.com`,
                membership: {
                    status: 'Active',
                    tier: 'Silver',
                    joinedAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
                    approvedAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
                    expiresAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
                    pointsBalance: 500,
                    renewalCount: 0,
                },
                role: 'Member',
            },
            {
                name: 'TEST-EXPIRED-7DAYS',
                email: `test-expired-7d-${Date.now()}@test.com`,
                membership: {
                    status: 'Active',
                    tier: 'Gold',
                    joinedAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
                    approvedAt: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
                    expiresAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    pointsBalance: 1000,
                    renewalCount: 1,
                },
                role: 'Member',
            },
            {
                name: 'TEST-EXPIRES-TOMORROW',
                email: `test-expires-tomorrow-${Date.now()}@test.com`,
                membership: {
                    status: 'Active',
                    tier: 'Platinum',
                    joinedAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
                    approvedAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
                    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
                    pointsBalance: 2000,
                    renewalCount: 0,
                },
                role: 'Member',
            },
            {
                name: 'TEST-ACTIVE-VALID',
                email: `test-active-${Date.now()}@test.com`,
                membership: {
                    status: 'Active',
                    tier: 'Silver',
                    joinedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                    approvedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                    expiresAt: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000), // 300 days
                    pointsBalance: 750,
                    renewalCount: 0,
                },
                role: 'Member',
            },
        ];

        console.log('📋 Creating test customers...\n');
        for (const data of testCustomers) {
            const customer = new Customer({
                name: data.name,
                contactInfo: {
                    email: data.email,
                    phone: '555-TEST-0000',
                    address: '123 Test Street, Test City',
                },
                role: data.role,
                membership: data.membership,
            });
            await customer.save();
            console.log(`✅ Created: ${data.name}`);
            console.log(`   Email: ${data.email}`);
            console.log(`   Expires: ${data.membership.expiresAt.toLocaleDateString()}`);
            console.log(`   Status: ${data.membership.status}\n`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('🎯 TEST CUSTOMERS CREATED SUCCESSFULLY!');
        console.log('='.repeat(70) + '\n');

        console.log('📋 TEST VERIFICATION STEPS:\n');
        console.log('1️⃣  CHECK STATS');
        console.log('   GET http://localhost:5000/api/memberships/stats');
        console.log('   → Expected: { expired: 2, active: 2 }\n');

        console.log('2️⃣  CHECK ALL CUSTOMERS');
        console.log('   GET http://localhost:5000/api/customers');
        console.log('   → Filter for "TEST-" names');
        console.log('   → Expected: TEST-EXPIRED-* have status "Expired" and role "Guest"\n');

        console.log('3️⃣  LOGIN AS EXPIRED MEMBER');
        console.log('   Email: (check above for TEST-EXPIRED-YESTERDAY email)');
        console.log('   → Expected: Membership banner should NOT appear\n');

        console.log('4️⃣  CHECK ADMIN DASHBOARD');
        console.log('   /admin/memberships');
        console.log('   → Expected: Expired members categorized correctly\n');

        console.log('='.repeat(70));
        console.log('✨ Ready to test! Start your server and run the tests above.');
        console.log('='.repeat(70));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

testMembershipExpiry();
