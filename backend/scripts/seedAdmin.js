import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// Load env vars
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to DB
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@poduris.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      name: 'Admin',
      role: 'admin',
      status: 'approved'
    });

    console.log('Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

