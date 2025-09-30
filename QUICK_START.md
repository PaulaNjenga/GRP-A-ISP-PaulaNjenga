# FemiHealth - Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly start the FemiHealth application with pre-seeded test data.

---

## Prerequisites

- ✅ Node.js installed
- ✅ MongoDB running
- ✅ Dependencies installed

---

## Starting the Application

### 1. Start Backend Server

```bash
cd femihealth-backend
npm run dev
```

The backend will start on **http://localhost:5000**

### 2. Start Frontend Server

```bash
cd femihealth-frontend
npm run dev
```

The frontend will start on **http://localhost:3000**

---

## Test User Credentials

### 👨‍💼 Admin Account
```
Email: admin@femihealth.com
Password: Admin123!
```
**Access:** Full system access, user management, analytics

### 👩‍⚕️ Doctor Account
```
Email: doctor@femihealth.com
Password: Doctor123!
```
**Access:** Create diagnoses, view patients, manage medical records

### 👤 Patient Account
```
Email: patient@femihealth.com
Password: Patient123!
```
**Access:** Risk predictions, view results, health tracking

---

## Testing Workflows

### As a Patient
1. Login with patient credentials
2. Navigate to "Predict" page
3. Fill out the PCOS risk assessment form
4. Submit and view results
5. Check dashboard for history

### As a Doctor
1. Login with doctor credentials
2. Access doctor dashboard
3. Create new diagnosis
4. Upload medical files
5. View patient records

### As an Admin
1. Login with admin credentials
2. Access admin panel
3. View system statistics
4. Manage users
5. Export data

---

## Database Management

### Reseed Database
```bash
cd femihealth-backend
npm run seed
```

This will:
- Clear existing users
- Create 6 fresh test users
- Display credentials

### View All Users
```bash
mongosh femihealth --eval "db.users.find({}, {name:1, email:1, role:1}).pretty()"
```

### Count Users by Role
```bash
mongosh femihealth --eval "db.users.aggregate([{$group: {_id: '$role', count: {$sum: 1}}}])"
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token

### Predictions
- `POST /api/predict/tabular` - Tabular data prediction
- `POST /api/predict/image` - Image prediction
- `POST /api/predict/multimodal` - Combined prediction
- `GET /api/predict/history` - Get prediction history

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/profile` - Get user profile

### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - System statistics
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

---

## Testing API with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@femihealth.com","password":"Patient123!"}'
```

### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"New User",
    "email":"newuser@example.com",
    "password":"Password123!",
    "gender":"female"
  }'
```

### Get Dashboard (with token)
```bash
TOKEN="your-jwt-token-here"
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
systemctl status mongod

# Start MongoDB if needed
sudo systemctl start mongod

# Check if port 5000 is in use
lsof -i :5000
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection error
```bash
# Check MongoDB connection
mongosh femihealth

# If connection fails, check MongoDB status
sudo systemctl status mongod
```

### Seed script fails
```bash
# Drop all indexes and retry
mongosh femihealth --eval "db.users.dropIndexes()"
npm run seed
```

---

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- Frontend: Changes auto-refresh in browser
- Backend: Nodemon restarts server on file changes

### View Logs
- Backend logs: Check terminal running `npm run dev`
- Frontend logs: Check browser console (F12)
- MongoDB logs: `sudo journalctl -u mongod -f`

### Database GUI
Use MongoDB Compass for visual database management:
```
Connection String: mongodb://localhost:27017/femihealth
```

---

## Additional Test Users

Besides the main test accounts, you also have:

| Name | Email | Role | Password |
|------|-------|------|----------|
| Mary Smith | mary.smith@example.com | user | User123! |
| Dr. Emily Brown | emily.brown@femihealth.com | doctor | Doctor123! |
| Lisa Anderson | lisa.anderson@example.com | user | User123! |

---

## Next Steps

1. ✅ Test user authentication
2. ✅ Explore different user roles
3. 🔄 Test prediction functionality
4. 🔄 Test file uploads
5. 🔄 Test admin operations
6. 🔄 Test data export features

---

## Support

For issues or questions:
- Check `TEST_RESULTS.md` for detailed test information
- Review API documentation in backend README
- Check frontend component documentation

---

**Happy Testing! 🎉**
