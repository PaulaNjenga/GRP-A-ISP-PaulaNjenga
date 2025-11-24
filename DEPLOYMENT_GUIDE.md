# FemiHealth Deployment Guide
**Complete Production Deployment for Thesis Submission**

Author: Njenga Paula Waithira (143109)  
Institution: Strathmore University  
Date: June 2025

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [ML Service Deployment](#ml-service-deployment)
4. [Backend API Deployment](#backend-api-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: v18+ (for backend & frontend)
- **Python**: 3.8+ (for ML service)
- **MongoDB**: 5.0+ (database)
- **Git**: Latest version

### Required Accounts (for production)
- **MongoDB Atlas** (free tier): https://www.mongodb.com/cloud/atlas
- **Netlify/Vercel** (frontend): Free tier
- **Render/Railway** (backend): Free tier
- **PythonAnywhere/Render** (ML service): Free tier

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd femiHealth
```

### 2. Install Dependencies

#### Backend
```bash
cd femihealth-backend
npm install
```

#### Frontend
```bash
cd femihealth-frontend
npm install
```

#### ML Service
```bash
cd ml-service
pip install -r requirements_41.txt
```

### 3. Setup Environment Variables

#### Backend (.env)
```bash
cd femihealth-backend
cp .env.example .env
```

Edit `.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/femihealth

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# ML Service
ML_SERVICE_URL=http://localhost:5001

# Email (optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### ML Service (.env)
```bash
cd ml-service
touch .env
```

Edit `.env`:
```env
FLASK_ENV=development
FLASK_DEBUG=1
```

### 4. Start Services

#### Terminal 1: MongoDB
```bash
mongod
```

#### Terminal 2: Backend
```bash
cd femihealth-backend
npm start
# Server runs on http://localhost:5000
```

#### Terminal 3: ML Service
```bash
cd ml-service
python app_41_features.py
# Service runs on http://localhost:5001
```

#### Terminal 4: Frontend
```bash
cd femihealth-frontend
npm run dev
# App runs on http://localhost:3000
```

---

## ML Service Deployment

### Option 1: Render (Recommended)

#### 1. Prepare for Deployment
```bash
cd ml-service
```

Create `render.yaml`:
```yaml
services:
  - type: web
    name: femihealth-ml-service
    env: python
    buildCommand: pip install -r requirements_41.txt
    startCommand: gunicorn app_41_features:app
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.0
```

Create `requirements.txt` (add gunicorn):
```txt
Flask==2.3.3
flask-cors==4.0.0
joblib==1.3.2
pandas==2.1.4
numpy==1.24.3
scikit-learn==1.3.2
tensorflow==2.15.0
opencv-python-headless==4.8.1.78
Pillow==10.0.1
gunicorn==21.2.0
```

#### 2. Deploy to Render
1. Push code to GitHub
2. Go to https://render.com
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Select `ml-service` directory
6. Configure:
   - **Name**: femihealth-ml-service
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements_41.txt`
   - **Start Command**: `gunicorn app_41_features:app --bind 0.0.0.0:$PORT`
7. Click "Create Web Service"
8. Copy the service URL (e.g., `https://femihealth-ml-service.onrender.com`)

### Option 2: PythonAnywhere

#### 1. Upload Files
```bash
# Zip your ml-service folder
cd ml-service
zip -r ml-service.zip .
```

#### 2. Setup on PythonAnywhere
1. Go to https://www.pythonanywhere.com
2. Create free account
3. Upload `ml-service.zip`
4. Open Bash console:
```bash
unzip ml-service.zip
pip install --user -r requirements_41.txt
```

5. Create WSGI file:
```python
import sys
path = '/home/yourusername/ml-service'
if path not in sys.path:
    sys.path.append(path)

from app_41_features import app as application
```

6. Configure web app in Web tab
7. Reload web app

---

## Backend API Deployment

### Option 1: Render

#### 1. Update `package.json`
```json
{
  "scripts": {
    "start": "node src/server.js",
    "build": "echo 'No build required'"
  },
  "engines": {
    "node": "18.x"
  }
}
```

#### 2. Deploy to Render
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Select `femihealth-backend` directory
5. Configure:
   - **Name**: femihealth-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<strong-secret-key>
   JWT_EXPIRE=7d
   FRONTEND_URL=<your-frontend-url>
   ML_SERVICE_URL=<your-ml-service-url>
   ```
7. Click "Create Web Service"

### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
cd femihealth-backend
railway init

# Deploy
railway up
```

---

## Frontend Deployment

### Option 1: Netlify (Recommended)

#### 1. Update API Base URL
Edit `femihealth-frontend/src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### 2. Create `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 3. Deploy
1. Push to GitHub
2. Go to https://netlify.com
3. Click "Add new site" → "Import from Git"
4. Select repository
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
7. Click "Deploy"

### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd femihealth-frontend
vercel
```

---

## Environment Configuration

### Production Environment Variables

#### Backend
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/femihealth
JWT_SECRET=<64-character-random-string>
JWT_EXPIRE=7d
FRONTEND_URL=https://femihealth.netlify.app
ML_SERVICE_URL=https://femihealth-ml-service.onrender.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=femihealth@gmail.com
EMAIL_PASSWORD=<app-specific-password>
```

#### Frontend
```env
VITE_API_URL=https://femihealth-api.onrender.com
```

---

## Testing

### 1. Test ML Service
```bash
curl -X POST https://your-ml-service-url/predict \
  -H "Content-Type: application/json" \
  -d '{
    "clinical": {
      "Age (yrs)": 28,
      "Weight (Kg)": 70,
      "Height(Cm)": 165,
      "Cycle length(days)": 35,
      "Weight gain(Y/N)": 1,
      "hair growth(Y/N)": 1,
      "Skin darkening (Y/N)": 0,
      "Pimples(Y/N)": 1,
      "Fast food (Y/N)": 1,
      "Reg.Exercise(Y/N)": 0
    }
  }'
```

### 2. Test Backend API
```bash
# Health check
curl https://your-backend-url/health

# Register user
curl -X POST https://your-backend-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 3. Test Frontend
1. Visit your frontend URL
2. Register new account
3. Navigate to PCOS Prediction page
4. Fill form and submit
5. Verify results display correctly

---

## Troubleshooting

### ML Service Issues

#### Model Not Loading
```bash
# Ensure artifacts exist
ls ml-service/artifacts/
# Should show: rf_pcos_model.pkl, scaler.pkl
```

#### Memory Issues on Free Tier
- Use `opencv-python-headless` instead of `opencv-python`
- Reduce TensorFlow to CPU-only version
- Consider upgrading to paid tier

### Backend Issues

#### MongoDB Connection Failed
- Check MongoDB Atlas whitelist (allow 0.0.0.0/0 for development)
- Verify connection string format
- Check network access settings

#### CORS Errors
```javascript
// Update CORS in server.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.netlify.app'
  ],
  credentials: true
}));
```

### Frontend Issues

#### API Calls Failing
- Check browser console for errors
- Verify API_URL environment variable
- Check network tab for request details
- Ensure backend is running

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## Post-Deployment Checklist

- [ ] ML Service health check passes
- [ ] Backend API health check passes
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] PCOS prediction works
- [ ] Results display correctly
- [ ] All environment variables set
- [ ] HTTPS enabled (production)
- [ ] Error logging configured
- [ ] Database backups enabled

---

## Support

For issues or questions:
- **Email**: paula.njenga@strathmore.edu
- **GitHub Issues**: Create issue in repository
- **Documentation**: See README files in each directory

---

## License

This project is part of Njenga Paula Waithira's thesis submission to Strathmore University (June 2025).

**Congratulations on your deployment, Paula! 🎓🎉**
