import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

const debugExpiry = async () => {
    try {
        await mongoose.connect(process.env.URI || process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Check current TEST customers
        console.log('📋 Checking TEST customers BEFORE update...\n');
        const testCustomersBefore = await Customer.find({ name: /^TEST-/ });
        testCustomersBefore.forEach(c => {
            const now = new Date();
            const expiry = new Date(c.membership.expiresAt);
            const isExpired = expiry < now;
            console.log(`${c.name}:`);
            console.log(`  Status: ${c.membership.status}`);
            console.log(`  ExpiresAt: ${c.membership.expiresAt}`);
            console.log(`  Now: ${now.toISOString()}`);
            console.log(`  Expired (${expiry} < ${now})?: ${isExpired}\n`);
        });

        // Try to expire them manually
        console.log('⏳ Running expireActiveMemberships update...\n');
        const now = new Date();
        const result = await Customer.updateMany(
            {
                'membership.status': 'Active',
                'membership.expiresAt': { $lt: now },
            },
            {
                $set: {
                    'membership.status': 'Expired',
                    role: 'Guest',
                    updatedAt: new Date(),
                },
            }
        );

        console.log('Update result:', {
            matched: result.matchedCount,
            modified: result.modifiedCount,
        }, '\n');

        // Check AFTER
        console.log('📋 Checking TEST customers AFTER update...\n');
        const testCustomersAfter = await Customer.find({ name: /^TEST-/ });
        testCustomersAfter.forEach(c => {
            console.log(`${c.name}:`);
            console.log(`  Status: ${c.membership.status}`);
            console.log(`  Role: ${c.role}\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

debugExpiry();
