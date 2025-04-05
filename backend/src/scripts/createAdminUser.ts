import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User, { UserRole } from '../models/User.js';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting admin user creation script...');

// Default admin credentials - override with environment variables
const DEFAULT_ADMIN_EMAIL = 'admin@billgen.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@12345';

// Use environment variables if available, otherwise use defaults
const adminEmail = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      console.log(`Admin user with email ${adminEmail} already exists`);
      return;
    }
    
    // Create new admin user
    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      role: UserRole.ADMIN
    });
    
    await admin.save();
    console.log(`Admin user created with email: ${adminEmail}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await createAdminUser();
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Script execution error:', error);
    process.exit(1);
  }
};

// Run the script
main(); 