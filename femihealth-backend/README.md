# FemiHealth Backend API

A Node.js/Express backend server for the FemiHealth application providing REST API endpoints for authentication, predictions, and data management.

## Features

- **Authentication**: Login, register, logout, token verification
- **Health Predictions**: Tabular and image-based PCOS risk predictions
- **User Management**: Profile management and admin controls
- **Data Export**: CSV export functionality
- **Security**: CORS, rate limiting, helmet security headers
- **Mock Data**: Development-ready with mock responses

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification

### Dashboard
- `GET /api/dashboard` - User dashboard data
- `GET /api/dashboard/profile` - User profile

### Predictions
- `POST /api/predict/tabular` - Tabular data prediction
- `POST /api/predict/image` - Image-based prediction

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - User management

### Export
- `GET /api/export/csv/:dataType` - CSV data export

### Health Check
- `GET /health` - Server health status

## Environment Variables

Create a `.env` file with:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
DB_CONNECTION_STRING=mongodb://localhost:27017/femihealth
CORS_ORIGIN=http://localhost:3000
```

## Development Notes

- Currently uses mock data for all endpoints
- Ready for database integration (MongoDB/PostgreSQL)
- JWT authentication structure in place
- CORS configured for frontend on port 3000
- Rate limiting: 100 requests per 15 minutes per IP

## Next Steps

1. Integrate real database (MongoDB/PostgreSQL)
2. Implement actual JWT authentication
3. Add ML model integration for predictions
4. Add input validation and sanitization
5. Add comprehensive error handling
6. Add API documentation (Swagger/OpenAPI)
