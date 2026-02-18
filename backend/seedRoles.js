/**
 * One-time script to seed admin & technician accounts.
 * Run: node seedRoles.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ACCOUNTS = [
    {
        name: 'Akshat (Admin)',
        email: 'admin@repairmate.com',
        password: '15876521',
        role: 'admin',
    },
    {
        name: 'Akshat (Technician)',
        email: 'tech@repairmate.com',
        password: '15876521',
        role: 'technician',
    },
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        for (const acct of ACCOUNTS) {
            const exists = await User.findOne({ email: acct.email });
            if (exists) {
                // Update role if account exists but role differs
                if (exists.role !== acct.role) {
                    exists.role = acct.role;
                    await exists.save({ validateBeforeSave: false });
                    console.log(`🔄 Updated ${acct.email} → role: ${acct.role}`);
                } else {
                    console.log(`⏭️  ${acct.email} already exists with role: ${acct.role}`);
                }
            } else {
                await User.create(acct);
                console.log(`✅ Created ${acct.email} → role: ${acct.role}`);
            }
        }

        // Also upgrade the main account to admin if needed
        const mainUser = await User.findOne({ email: 'kakshat111@gmail.com' });
        if (mainUser) {
            console.log(`ℹ️  kakshat111@gmail.com exists with role: ${mainUser.role}`);
        }

        console.log('\n🎉 Done! Login credentials:');
        console.log('   Admin:      admin@repairmate.com / 15876521');
        console.log('   Technician: tech@repairmate.com  / 15876521');
        console.log('   User:       kakshat111@gmail.com / 15876521');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();
