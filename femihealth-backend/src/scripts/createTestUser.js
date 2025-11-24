import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const createTestUser = async () => {
  try {
    console.log('🔧 Creating simple test user...');

    // Connect to database
    await connectDB();

    // Delete existing test user if it exists
    const existingUser = await User.findOne({ email: 'test@test.com' });
    if (existingUser) {
      await User.deleteOne({ email: 'test@test.com' });
      console.log('🗑️ Deleted existing test user');
    }

    // Create simple test user with proper password length
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'test123456',
      role: 'user',
      isActive: true,
      emailVerified: true,
      mfaEnabled: false // Start with MFA disabled for easy testing
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: test123456');
    console.log('👤 User ID:', testUser._id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
