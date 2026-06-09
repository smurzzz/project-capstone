#!/usr/bin/env node
import 'dotenv/config';
import connectDb from '../db/connect.js';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';

const run = async () => {
  try {
    await connectDb();

    console.log('Connected to DB, querying pending applications...');
    const filter = { 'membership.status': 'Pending' };
    const docs = await Customer.find(filter).lean();
    const total = docs.length;

    if (total === 0) {
      console.log('No pending application documents found. Aborting.');
      process.exit(0);
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `customers_pending_backup_${ts}`;

    console.log(`Backing up ${total} documents to collection: ${backupName}`);
    const backupColl = mongoose.connection.collection(backupName);
    const insertResult = await backupColl.insertMany(docs);
    console.log(`Backup insertedCount=${insertResult.insertedCount}`);

    // Perform the selective reset for pending applications
    const update = {
      $set: {
        role: 'Guest',
        'membership.status': 'None',
        'membership.tier': 'Silver',
        'membership.pointsBalance': 0,
        'membership.joinedAt': null,
        'membership.approvedAt': null,
        'membership.expiresAt': null,
        'membership.renewalCount': 0,
        selectedPackageDeal: null,
        entryPackage: 'None',
        applicationNotes: ''
      },
      $unset: {
        applicationSubmittedAt: "",
        idDocument: ""
      }
    };

    console.log('Running updateMany to reset pending customer records...');
    const result = await Customer.updateMany(filter, update);

    console.log('Update result:', result);
    console.log(`Matched: ${result.matchedCount ?? result.n ?? 0}, Modified: ${result.modifiedCount ?? result.nModified ?? 0}`);

    console.log('Backup and selective reset complete. Backup collection:', backupName);
    process.exit(0);
  } catch (err) {
    console.error('Error during backup/reset:', err);
    process.exit(2);
  }
};

run();
