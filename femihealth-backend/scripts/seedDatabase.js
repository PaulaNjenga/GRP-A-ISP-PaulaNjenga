const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { User, Prediction, USER_ROLES } = require('../models/UserMongoDB');

// Generate random dates within the last 30 days
const getRandomDate = (daysBack = 30) => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
};

// Generate realistic user data
const generateUsers = (count = 50) => {
  const users = [];
  const firstNames = ['Emma', 'James', 'Olivia', 'William', 'Ava', 'Benjamin', 'Sophia', 'Lucas', 'Isabella', 'Mason', 'Mia', 'Ethan', 'Charlotte', 'Alexander', 'Amelia', 'Henry', 'Harper', 'Michael', 'Evelyn', 'Daniel', 'Abigail', 'Jackson', 'Elizabeth', 'Sebastian', 'Sofia', 'David', 'Avery', 'Carter', 'Scarlett', 'Joseph', 'Victoria', 'Owen', 'Madison', 'Wyatt', 'Luna', 'John', 'Grace', 'Jack', 'Chloe', 'Luke', 'Penelope', 'Grayson', 'Layla', 'Levi', 'Riley', 'Julian', 'Zoey', 'Mateo', 'Nora', 'Leo'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Williams', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

  // Add test users first
  users.push(
    // Test Patient User
    {
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'patient@test.com',
      password: 'patient123',
      dateOfBirth: new Date('1995-08-15'),
      height: 165,
      weight: 58,
      role: USER_ROLES.PATIENT,
      medicalHistory: ['Irregular periods', 'Family history of PCOS'],
      medications: ['Multivitamin'],
      allergies: ['Penicillin'],
      isEmailVerified: true,
      createdAt: new Date('2024-09-01'),
      lastLogin: new Date('2024-09-28')
    },
    // Test Doctor User
    {
      firstName: 'Dr. Michael',
      lastName: 'Rodriguez',
      email: 'doctor@test.com',
      password: 'doctor123',
      dateOfBirth: new Date('1980-04-12'),
      role: USER_ROLES.DOCTOR,
      licenseNumber: 'MD789012',
      specialization: 'Endocrinology & PCOS Specialist',
      hospital: 'Women\'s Health Medical Center',
      verificationStatus: 'verified',
      yearsOfExperience: 15,
      isEmailVerified: true,
      createdAt: new Date('2024-09-01'),
      lastLogin: new Date('2024-09-29')
    },
    // Test Admin User
    {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@test.com',
      password: 'admin123',
      dateOfBirth: new Date('1985-01-01'),
      role: USER_ROLES.ADMIN,
      isEmailVerified: true,
      createdAt: new Date('2024-09-01'),
      lastLogin: new Date('2024-09-29')
    }
  );

  // Generate additional random users
  for (let i = 3; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const age = Math.floor(Math.random() * 45) + 18; // 18-63 years old
    const height = Math.floor(Math.random() * 40) + 140; // 140-180 cm
    const weight = Math.floor(Math.random() * 60) + 45; // 45-105 kg
    const createdAt = getRandomDate(30);
    const lastLogin = Math.random() > 0.3 ? getRandomDate(7) : null; // 70% have recent login

    // Random role distribution (mostly patients)
    let role;
    const roleRand = Math.random();
    if (roleRand < 0.85) role = USER_ROLES.PATIENT;
    else if (roleRand < 0.95) role = USER_ROLES.DOCTOR;
    else role = USER_ROLES.ADMIN;

    const user = {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      password: 'password123',
      dateOfBirth: new Date(Date.now() - (age * 365.25 * 24 * 60 * 60 * 1000)), // Use 365.25 for leap years
      height,
      weight,
      role,
      isEmailVerified: Math.random() > 0.1, // 90% verified
      isActive: Math.random() > 0.05, // 95% active
      createdAt,
      lastLogin
    };

    // Add role-specific fields
    if (role === USER_ROLES.DOCTOR) {
      const specializations = ['Endocrinology', 'Gynecology', 'Obstetrics', 'Internal Medicine', 'Family Medicine'];
      user.licenseNumber = `MD${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
      user.specialization = specializations[Math.floor(Math.random() * specializations.length)];
      user.hospital = `${['City', 'Regional', 'Community', 'University', 'General'][Math.floor(Math.random() * 5)]} Medical Center`;
      user.verificationStatus = Math.random() > 0.1 ? 'verified' : 'pending';
      user.yearsOfExperience = Math.floor(Math.random() * 30) + 1;
    }

    if (role === USER_ROLES.PATIENT) {
      const conditions = ['Irregular periods', 'Weight gain', 'Acne', 'Hair loss', 'Infertility', 'Family history of PCOS'];
      const medications = ['Metformin', 'Birth control pills', 'Clomid', 'Multivitamin', 'Insulin'];
      const allergies = ['Penicillin', 'Sulfa drugs', 'Latex', 'Shellfish', 'Nuts'];

      user.medicalHistory = conditions.filter(() => Math.random() > 0.7);
      user.medications = medications.filter(() => Math.random() > 0.8);
      user.allergies = allergies.filter(() => Math.random() > 0.85);
    }

    users.push(user);
  }

  return users;
};

// Generate realistic predictions
const generatePredictions = (users) => {
  const predictions = [];
  const patientUsers = users.filter(u => u.role === USER_ROLES.PATIENT);
  const doctorUsers = users.filter(u => u.role === USER_ROLES.DOCTOR);

  patientUsers.forEach((patient, index) => {
    // Each patient has 0-3 predictions
    const predictionCount = Math.floor(Math.random() * 4);

    for (let i = 0; i < predictionCount; i++) {
      const age = Math.floor((Date.now() - patient.dateOfBirth.getTime()) / (365 * 24 * 60 * 60 * 1000));
      const height = patient.height;
      const weight = patient.weight;
      const bmi = weight / ((height / 100) ** 2);

      // Generate realistic PCOS risk factors
      const irregularPeriods = Math.random() > 0.4;
      const weightGain = bmi > 25 ? Math.random() > 0.3 : Math.random() > 0.7;
      const acne = Math.random() > 0.6;
      const hairGrowth = Math.random() > 0.7;

      // Calculate risk based on factors
      let riskScore = 0.1; // Base risk
      if (irregularPeriods) riskScore += 0.25;
      if (weightGain) riskScore += 0.15;
      if (acne) riskScore += 0.1;
      if (hairGrowth) riskScore += 0.15;
      if (bmi > 30) riskScore += 0.2;
      if (age > 35) riskScore += 0.1;

      riskScore = Math.min(riskScore, 0.95); // Cap at 95%

      let riskLevel;
      if (riskScore < 0.3) riskLevel = 'low';
      else if (riskScore < 0.7) riskLevel = 'moderate';
      else riskLevel = 'high';

      const prediction = {
        userId: patient._id,
        anonymousUserId: patient.anonymousId,
        type: ['tabular', 'image', 'multimodal'][Math.floor(Math.random() * 3)],
        purpose: 'self_assessment',
        inputData: {
          age,
          weight,
          height,
          bmi: parseFloat(bmi.toFixed(1)),
          glucose: 70 + Math.floor(Math.random() * 60), // 70-130
          insulin: 5 + Math.floor(Math.random() * 25), // 5-30
          testosterone: Math.floor(Math.random() * 100) + 20, // 20-120
          lhFshRatio: parseFloat((Math.random() * 4 + 0.5).toFixed(1)), // 0.5-4.5
          irregularPeriods,
          weightGain,
          acne,
          hairGrowth,
          exerciseFrequency: ['never', 'rarely', 'sometimes', 'often', 'daily'][Math.floor(Math.random() * 5)],
          dietType: ['balanced', 'high_carb', 'low_carb', 'vegetarian', 'vegan'][Math.floor(Math.random() * 5)],
          stressLevel: Math.floor(Math.random() * 10) + 1,
          sleepHours: 4 + Math.floor(Math.random() * 8), // 4-12 hours
          familyHistoryPCOS: Math.random() > 0.8
        },
        risk: parseFloat(riskScore.toFixed(3)),
        confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(3)), // 0.7-1.0
        riskLevel,
        riskFactors: [
          { factor: 'Irregular periods', impact: irregularPeriods ? 'high' : 'low', value: irregularPeriods },
          { factor: 'Weight gain', impact: weightGain ? 'moderate' : 'low', value: weightGain },
          { factor: 'Acne', impact: acne ? 'low' : 'low', value: acne },
          { factor: 'Excess hair growth', impact: hairGrowth ? 'moderate' : 'low', value: hairGrowth },
          { factor: 'BMI', impact: bmi > 30 ? 'high' : bmi > 25 ? 'moderate' : 'low', value: bmi }
        ],
        recommendations: [
          'Consult with a healthcare provider for personalized advice',
          'Maintain a healthy diet and regular exercise routine',
          'Track menstrual cycles and symptoms',
          'Consider hormonal evaluation if symptoms persist'
        ].slice(0, Math.floor(Math.random() * 3) + 2),
        status: 'completed',
        createdAt: getRandomDate(30)
      };

      // Add doctor involvement for some predictions
      if (Math.random() > 0.7 && doctorUsers.length > 0) { // 30% have doctor involvement
        const randomDoctor = doctorUsers[Math.floor(Math.random() * doctorUsers.length)];
        prediction.doctorId = randomDoctor._id;
        prediction.purpose = 'medical_diagnosis';
        prediction.clinicalNotes = 'Patient presents with PCOS-related symptoms. Comprehensive evaluation recommended.';
        prediction.diagnosis = ['PCOS - Polycystic Ovary Syndrome', 'Suspected PCOS', 'PCOS with metabolic features'][Math.floor(Math.random() * 3)];
        prediction.treatmentPlan = ['Lifestyle modifications', 'Metformin therapy', 'Hormonal contraceptives', 'Combined approach'][Math.floor(Math.random() * 4)];
        prediction.followUpDate = new Date(Date.now() + Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000); // 0-90 days
      }

      predictions.push(prediction);
    }
  });

  return predictions;
};

async function seedDatabase() {
  try {
    // Connect to database
    await connectDB();

    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Prediction.deleteMany({});
    console.log('✅ Cleared existing data');

    // Generate and create users
    console.log('👥 Generating user data...');
    const seedUsers = generateUsers(100); // Generate 100 users total (97 random + 3 test)
    console.log(`📝 Generated ${seedUsers.length} users`);

    const createdUsers = [];
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < seedUsers.length; i++) {
      const userData = seedUsers[i];
      try {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        successCount++;
        
        // Log every 10th user to show progress
        if (successCount % 10 === 0) {
          console.log(`✅ Created ${successCount} users...`);
        }
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to create user ${userData.email}:`, error.message);
        
        // Stop after first few failures to avoid spam
        if (failedCount <= 3) {
          console.error('User data:', JSON.stringify(userData, null, 2));
        }
      }
    }
    
    console.log(`✅ Successfully created ${successCount} users`);
    if (failedCount > 0) {
      console.log(`❌ Failed to create ${failedCount} users`);
    }

    // Generate and create predictions
    console.log('🔮 Generating prediction data...');
    const seedPredictions = generatePredictions(createdUsers);
    console.log(`📊 Generated ${seedPredictions.length} predictions`);

    for (const predictionData of seedPredictions) {
      const prediction = new Prediction(predictionData);
      await prediction.save();
    }
    console.log(`✅ Created ${seedPredictions.length} predictions`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('Patient: patient@test.com / patient123');
    console.log('Doctor: doctor@test.com / doctor123');
    console.log('Admin: admin@test.com / admin123');

    // Display database stats
    const userCount = await User.countDocuments();
    const predictionCount = await Prediction.countDocuments();

    // Get detailed stats
    const userRoleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const predictionRiskStats = await Prediction.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    const predictionTypeStats = await Prediction.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    console.log(`\n📊 Database Stats:`);
    console.log(`Users: ${userCount}`);
    console.log(`Predictions: ${predictionCount}`);
    console.log('\n👥 User Roles:');
    userRoleStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });
    console.log('\n📈 Risk Levels:');
    predictionRiskStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });
    console.log('\n🔬 Prediction Types:');
    predictionTypeStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    // Get date range for user registrations
    const userDateRange = await User.aggregate([
      { $group: { _id: null, min: { $min: '$createdAt' }, max: { $max: '$createdAt' } } }
    ]);

    if (userDateRange.length > 0) {
      console.log('\n📅 User Registration Range:');
      console.log(`  From: ${userDateRange[0].min.toISOString().split('T')[0]}`);
      console.log(`  To: ${userDateRange[0].max.toISOString().split('T')[0]}`);
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
