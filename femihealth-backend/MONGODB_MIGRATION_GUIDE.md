# MongoDB Migration Guide for FemiHealth

## Overview

This guide covers the complete migration from in-memory data storage to MongoDB with Mongoose for the FemiHealth PCOS assessment application. The migration maintains all existing functionality while adding proper data persistence, scalability, and advanced querying capabilities.

## 🚀 **Migration Steps**

### 1. Prerequisites

**Install MongoDB:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS with Homebrew
brew install mongodb-community

# Or use MongoDB Atlas (cloud)
# Sign up at https://www.mongodb.com/atlas
```

**Start MongoDB Service:**
```bash
# Local MongoDB
sudo systemctl start mongodb

# Or use MongoDB Compass for GUI management
```

### 2. Environment Configuration

**Updated `.env` file:**
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MONGODB_URI=mongodb://localhost:27017/femihealth
CORS_ORIGIN=http://localhost:3000

# File Upload Settings
UPLOAD_MAX_SIZE=10485760
UPLOAD_DIR=./uploads

# Security Settings
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/femihealth?retryWrites=true&w=majority
```

### 3. Database Setup

**Seed the database with test data:**
```bash
npm run seed
```

This creates:
- 3 test users (Patient, Doctor, Admin)
- 2 sample predictions
- Proper indexes and relationships

## 📊 **Schema Changes**

### User Schema Enhancements

**New Features:**
- **Mongoose Validation**: Built-in field validation and constraints
- **Indexes**: Optimized queries for email, role, anonymousId
- **Virtuals**: Computed fields like age, BMI, fullName
- **Middleware**: Automatic password hashing and anonymization
- **Methods**: Instance methods for permissions, anonymization
- **Statics**: Class methods for analytics and stats

**Key Fields Added:**
```javascript
// Security enhancements
loginAttempts: Number,
lockUntil: Date,
isEmailVerified: Boolean,
emailVerificationToken: String,
passwordResetToken: String,

// Enhanced profile data
profilePhoto: String,
bio: String,
emergencyContact: Object,

// Privacy settings
profileVisibility: String,
dataSharing: Object,
notifications: Object
```

### Prediction Schema Enhancements

**New Features:**
- **Rich Input Data**: Expanded health factors and lifestyle data
- **File Attachments**: Proper file metadata and storage
- **Clinical Data**: Enhanced medical information for doctors
- **Analytics**: Built-in anonymization for research
- **Status Tracking**: Workflow management for diagnoses

**Key Fields Added:**
```javascript
// Enhanced input data
exerciseFrequency: String,
dietType: String,
stressLevel: Number,
familyHistory: Boolean,
bloodPressure: Object,
cholesterol: Object,

// File management
attachments: [{
  type: String,
  filename: String,
  path: String,
  size: Number,
  mimeType: String
}],

// Clinical workflow
status: String,
reviewedBy: ObjectId,
reviewedAt: Date,
consentGiven: Boolean
```

## 🔄 **API Changes**

### Authentication Updates

**Login Endpoint:**
```javascript
// Before (in-memory)
const user = User.findByEmail(email);

// After (MongoDB)
const user = await User.findOne({ email: email.toLowerCase() });
const isValid = await user.comparePassword(password);
```

**Registration Endpoint:**
```javascript
// Before (in-memory)
const user = User.create(userData);

// After (MongoDB)
const user = new User(userData);
await user.save(); // Triggers pre-save middleware
```

### Query Updates

**Find Operations:**
```javascript
// Before
const users = User.getAll();
const user = User.findById(id);

// After
const users = await User.find({});
const user = await User.findById(id);
```

**Filtering and Pagination:**
```javascript
// Before
const predictions = Prediction.findByUserId(userId, limit, offset);

// After
const predictions = await Prediction
  .find({ userId })
  .populate('userId', 'firstName lastName anonymousId')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset);
```

### Analytics Queries

**Aggregation Pipeline:**
```javascript
// Advanced analytics with MongoDB aggregation
const stats = await User.aggregate([
  {
    $group: {
      _id: '$role',
      count: { $sum: 1 },
      avgAge: { $avg: '$age' }
    }
  }
]);
```

## 🛡️ **Security Enhancements**

### Password Security
- **Bcrypt Hashing**: Automatic password hashing with configurable rounds
- **Password Validation**: Minimum length and complexity requirements
- **Account Lockout**: Protection against brute force attacks

### Data Protection
- **Field Encryption**: Sensitive fields can be encrypted at rest
- **Audit Trails**: Comprehensive logging with anonymous IDs
- **Data Anonymization**: Automatic PII masking and categorization

### Access Control
- **Role-Based Permissions**: Enhanced RBAC with MongoDB queries
- **Resource Ownership**: Proper user data isolation
- **Doctor Verification**: Medical professional credential validation

## 📈 **Performance Optimizations**

### Database Indexes
```javascript
// Automatically created indexes
userSchema.index({ email: 1 });
userSchema.index({ anonymousId: 1 });
userSchema.index({ role: 1 });
predictionSchema.index({ userId: 1, createdAt: -1 });
```

### Query Optimization
- **Population**: Efficient relationship loading
- **Projection**: Select only needed fields
- **Aggregation**: Complex analytics in database
- **Pagination**: Proper limit/skip implementation

### Caching Strategy
```javascript
// Redis integration (future enhancement)
const cachedUser = await redis.get(`user:${userId}`);
if (!cachedUser) {
  const user = await User.findById(userId);
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
}
```

## 🔧 **Development Workflow**

### Running the Application

**Start MongoDB:**
```bash
# Local
sudo systemctl start mongodb

# Or Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Initialize Database:**
```bash
npm run seed
```

**Start Development Server:**
```bash
npm run dev
```

### Database Management

**View Data:**
```bash
# MongoDB Shell
mongo femihealth

# Show collections
show collections

# Query users
db.users.find().pretty()

# Query predictions
db.predictions.find().pretty()
```

**Backup Database:**
```bash
mongodump --db femihealth --out ./backup
```

**Restore Database:**
```bash
mongorestore --db femihealth ./backup/femihealth
```

## 🧪 **Testing**

### Test User Credentials
```
Patient: patient@test.com / patient123
Doctor: doctor@test.com / doctor123
Admin: admin@test.com / admin123
```

### API Testing
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@test.com","password":"patient123"}'

# Get Dashboard
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🚀 **Production Deployment**

### MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create cluster and database user
3. Whitelist IP addresses
4. Update MONGODB_URI in production environment

### Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/femihealth
JWT_SECRET=your-production-secret-key
BCRYPT_ROUNDS=12
```

### Performance Monitoring
- **MongoDB Compass**: Database monitoring and optimization
- **Atlas Monitoring**: Cloud-based performance insights
- **Application Logs**: Comprehensive error tracking

## 🔄 **Migration Checklist**

- ✅ **Database Connection**: MongoDB connection established
- ✅ **Schema Definition**: User and Prediction schemas created
- ✅ **Data Models**: Mongoose models with validation
- ✅ **Authentication**: Login/register updated for MongoDB
- ✅ **Middleware**: Enhanced auth middleware for MongoDB
- ✅ **Seeding**: Test data creation script
- ✅ **Anonymization**: PII protection maintained
- ✅ **Role-Based Access**: RBAC system preserved
- ✅ **File Uploads**: Medical document handling
- ✅ **Analytics**: Anonymized data aggregation

## 📚 **Additional Resources**

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [Security Best Practices](https://docs.mongodb.com/manual/security/)

## 🆘 **Troubleshooting**

### Common Issues

**Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB service is running

**Validation Error:**
```
ValidationError: Path `email` is required
```
**Solution:** Check required fields in request body

**Duplicate Key Error:**
```
E11000 duplicate key error collection
```
**Solution:** Email already exists, use different email

### Performance Issues
- Check database indexes
- Monitor query execution time
- Use MongoDB Profiler
- Optimize aggregation pipelines

The migration provides a robust, scalable foundation for the FemiHealth application with proper data persistence, enhanced security, and production-ready features.
