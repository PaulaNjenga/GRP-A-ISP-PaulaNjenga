# FemiHealth Backend API

Backend API for the FemiHealth PCOS prediction application.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (User, Doctor, Admin)
- **PCOS Prediction**: Support for tabular, image, and multimodal predictions
- **User Dashboard**: Personal health tracking and insights
- **Admin Dashboard**: User management, system statistics, and analytics
- **File Upload**: Secure image upload for medical scans
- **Export**: PDF and CSV export functionality
- **Security**: Helmet, rate limiting, input validation

## Tech Stack

- Node.js & Express
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- PDFKit for PDF generation
- Bcrypt for password hashing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Make sure MongoDB is running locally or update MONGODB_URI in .env

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRE`: Token expiration time
- `FRONTEND_URL`: Frontend URL for CORS
- `MAX_FILE_SIZE`: Maximum file upload size
- `UPLOAD_DIR`: Directory for uploaded files

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/verify` - Verify MFA
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password

### Predictions
- `POST /api/predict/tabular` - Predict using tabular data
- `POST /api/predict/image` - Predict using image
- `POST /api/predict/multimodal` - Predict using both
- `GET /api/predict/result/:id` - Get prediction result
- `GET /api/predict/history` - Get prediction history

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/profile` - Get user profile
- `PUT /api/dashboard/profile` - Update user profile
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/insights` - Get health insights

### Admin (Admin/Doctor only)
- `GET /api/admin/dashboard` - Get admin dashboard
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/predictions` - Get all predictions
- `GET /api/admin/analytics/predictions` - Get prediction analytics
- `GET /api/admin/logs` - Get activity logs
- `GET /api/admin/health` - Get system health

### Export
- `GET /api/export/pdf/:reportId` - Export prediction as PDF
- `GET /api/export/csv/:dataType` - Export data as CSV
- `GET /api/export/dashboard` - Export dashboard

### Files
- `POST /api/files/upload` - Upload single file
- `POST /api/files/upload-multiple` - Upload multiple files
- `DELETE /api/files/:fileId` - Delete file
- `GET /api/files/:fileId` - Get file info

## Default Users

After first run, you may want to create test users with different roles:

```javascript
// User role
{ email: "user@test.com", password: "password123", role: "user" }

// Doctor role
{ email: "doctor@test.com", password: "password123", role: "doctor" }

// Admin role
{ email: "admin@test.com", password: "password123", role: "admin" }
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start

# Run tests
npm test

# Run linter
npm run lint
```

## Notes

- The ML prediction logic is currently mocked. Replace `performMLPrediction` in `src/controllers/predictionController.js` with actual ML service calls.
- File uploads are stored locally in the `uploads` directory. For production, consider using cloud storage (S3, etc.).
- Email functionality for password reset is not implemented. Add nodemailer configuration for production use.

## License

MIT
