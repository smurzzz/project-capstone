# Membership Auto-Expiry Test Case

## 🎯 Test Objective
Verify that active memberships automatically expire when `expiresAt` date passes and status changes to "Expired"

---

## 📋 Test Scenario: Auto-Expiry with Minutes

### Setup: Create Test Customers with Short Expiry

**File:** `test-membership-expiry-short.mjs`

```javascript
import mongoose from 'mongoose';
import Customer from './models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

const testMembershipExpiry = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Clear old test data
        await Customer.deleteMany({ name: /^TEST-/ });

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

        console.log('✓ Test customers created!\n');
        console.log('📋 NEXT STEPS - Run these tests:\n');
        console.log('1️⃣  GET http://localhost:5000/api/memberships/stats');
        console.log('   → Should show: expired count = 2\n');
        console.log('2️⃣  GET http://localhost:5000/api/customers (as admin)');
        console.log('   → Filter for "TEST-" names');
        console.log('   → TEST-EXPIRED-* should have status: Expired\n');
        console.log('3️⃣  Login as TEST-EXPIRED-YESTERDAY');
        console.log('   → Membership banner should NOT appear\n');
        console.log('4️⃣  Check dashboard');
        console.log('   → Expired members should show Expired status\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

testMembershipExpiry();
```

---

## 🧪 Test Steps

### Step 1: Create Test Data
```bash
cd server
node test-membership-expiry-short.mjs
```

**Expected Output:**
```
✓ Connected to MongoDB
✅ Created: TEST-EXPIRED-YESTERDAY
   Email: test-expired-...@test.com
   Expires: 6/9/2026
   Status: Active

✅ Created: TEST-EXPIRED-7DAYS
   Email: test-expired-7d-...@test.com
   Expires: 6/3/2026
   Status: Active

... (and 2 more)
```

---

### Step 2: Check Membership Statistics
**Endpoint:** `GET /api/memberships/stats`

**cURL:**
```bash
curl -X GET http://localhost:5000/api/memberships/stats \
  -H "Authorization: Bearer <admin_token>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": 2,
    "active": 2,
    "expired": 2,
    "pending": 0,
    "approved": 0,
    "rejected": 0,
    "suspended": 0,
    "cancelled": 0
  }
}
```

✅ **Verification:** `expired: 2` (the two with past expiry dates)

---

### Step 3: Get All Customers & Verify Status
**Endpoint:** `GET /api/customers` (as admin)

**Expected Result:**
```json
{
  "success": true,
  "data": [
    {
      "name": "TEST-EXPIRED-YESTERDAY",
      "membership": {
        "status": "Expired",        // ← Changed from Active!
        "expiresAt": "2026-06-09T..."
      },
      "role": "Guest"               // ← Changed from Member!
    },
    {
      "name": "TEST-EXPIRED-7DAYS",
      "membership": {
        "status": "Expired",        // ← Changed from Active!
        "expiresAt": "2026-06-03T..."
      },
      "role": "Guest"               // ← Changed from Member!
    },
    {
      "name": "TEST-EXPIRES-TOMORROW",
      "membership": {
        "status": "Active",         // ← Still Active (future date)
        "expiresAt": "2026-06-11T..."
      },
      "role": "Member"
    },
    {
      "name": "TEST-ACTIVE-VALID",
      "membership": {
        "status": "Active",
        "expiresAt": "2026-12-03T..."
      },
      "role": "Member"
    }
  ]
}
```

✅ **Key Verifications:**
- ✅ `TEST-EXPIRED-YESTERDAY` status = `Expired`, role = `Guest`
- ✅ `TEST-EXPIRED-7DAYS` status = `Expired`, role = `Guest`
- ✅ `TEST-EXPIRES-TOMORROW` status still = `Active`, role still = `Member`
- ✅ `TEST-ACTIVE-VALID` status = `Active`, role = `Member`

---

### Step 4: Test Customer Login
**As Customer (TEST-EXPIRED-YESTERDAY):**
1. Login with email: `test-expired-...@test.com` (password: any)
2. Navigate to `/membership/status`

**Expected:**
- ❌ Membership banner does NOT appear
- ✅ Shows "Membership Expired" or renewal options
- ✅ Dashboard role shows as "Guest" instead of "Member"

---

### Step 5: Test Admin Dashboard
**As Admin:**
1. Login as staff/admin
2. Navigate to `/admin/memberships`
3. Look for "TEST-" customers

**Expected:**
- ✅ Expired members show in "Expired" status section
- ✅ Can see expiry dates clearly
- ✅ Renewal option available

---

## 🔄 Cleanup (Optional)
Remove test data:
```javascript
// In MongoDB shell or script
db.customers.deleteMany({ name: /^TEST-/ });
```

Or via API (admin only):
```bash
curl -X DELETE http://localhost:5000/api/customers/test-data \
  -H "Authorization: Bearer <admin_token>"
```

---

## ✅ All Tests Passed If:
1. ✅ Stats endpoint shows `expired: 2`
2. ✅ Expired customers have status = "Expired"
3. ✅ Expired customers have role = "Guest"
4. ✅ Active customers still show status = "Active"
5. ✅ Expired members can't see membership benefits
6. ✅ Admin dashboard correctly categorizes members

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Expired members still show Active | Call `expireActiveMemberships()` or restart server |
| Test data not created | Check MongoDB connection in `.env` |
| API returns 401 Unauthorized | Use valid admin token |
| Frontend shows wrong status | Clear browser cache & refresh |
