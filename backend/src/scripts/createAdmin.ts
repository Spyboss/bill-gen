/**
 * Script to create an admin user directly in the database
 * Run with: npm run ts-node src/scripts/createAdmin.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User, { UserRole } from '../models/User.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Admin user details - CHANGE THESE
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'AdminPass123!';
const ADMIN_NAME = 'System Admin';

async function createAdminUser() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bill-gen';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log(`Admin user with email ${ADMIN_EMAIL} already exists`);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const admin = new User({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: UserRole.ADMIN
    });

    await admin.save();
    console.log(`Admin user created successfully: ${ADMIN_EMAIL}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdminUser(); 