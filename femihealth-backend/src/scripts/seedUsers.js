import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

// Test users data
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@femihealth.com',
    password: 'Admin123!',
    role: 'admin',
    phone: '+254700000001',
    gender: 'female',
    dateOfBirth: new Date('1985-05-15'),
    isActive: true,
    permissions: ['manage_users', 'view_analytics', 'manage_system']
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'doctor@femihealth.com',
    password: 'Doctor123!',
    role: 'doctor',
    phone: '+254700000002',
    gender: 'female',
    dateOfBirth: new Date('1980-08-20'),
    isActive: true,
    permissions: ['create_diagnosis', 'view_patients', 'manage_records']
  },
  {
    name: 'Jane Doe',
    email: 'patient@femihealth.com',
    password: 'Patient123!',
    role: 'user',
    phone: '+254700000003',
    gender: 'female',
    dateOfBirth: new Date('1995-03-10'),
    isActive: true,
    medicalHistory: {
      allergies: ['Penicillin'],
      medications: [],
      conditions: []
    }
  },
  {
    name: 'Mary Smith',
    email: 'mary.smith@example.com',
    password: 'User123!',
    role: 'user',
    phone: '+254700000004',
    gender: 'female',
    dateOfBirth: new Date('1992-11-25'),
    isActive: true,
    medicalHistory: {
      allergies: [],
      medications: ['Metformin'],
      conditions: ['Type 2 Diabetes']
    }
  },
  {
    name: 'Dr. Emily Brown',
    email: 'emily.brown@femihealth.com',
    password: 'Doctor123!',
    role: 'doctor',
    phone: '+254700000005',
    gender: 'female',
    dateOfBirth: new Date('1983-06-12'),
    isActive: true,
    permissions: ['create_diagnosis', 'view_patients']
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    password: 'User123!',
    role: 'user',
    phone: '+254700000006',
    gender: 'female',
    dateOfBirth: new Date('1998-01-30'),
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing users (optional - comment out if you want to keep existing users)
    console.log('🗑️  Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Existing users cleared\n');

    // Create test users
    console.log('👥 Creating test users...\n');
    
    for (const userData of testUsers) {
      try {
        const user = await User.create(userData);
        console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
      }
    }

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📋 Test User Credentials:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Admin:');
    console.log('  Email: admin@femihealth.com');
    console.log('  Password: Admin123!');
    console.log('');
    console.log('Doctor:');
    console.log('  Email: doctor@femihealth.com');
    console.log('  Password: Doctor123!');
    console.log('');
    console.log('Patient/User:');
    console.log('  Email: patient@femihealth.com');
    console.log('  Password: Patient123!');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Get user count
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}\n`);

    // Display users by role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const userCount2 = await User.countDocuments({ role: 'user' });
    
    console.log('👥 Users by role:');
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Doctors: ${doctorCount}`);
    console.log(`   Patients: ${userCount2}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
