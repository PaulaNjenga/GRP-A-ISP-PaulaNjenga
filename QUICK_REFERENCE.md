# FemiHealth - Quick Reference Card

**Student**: Njenga Paula Waithira (143109) | **Strathmore University** | **June 2025**

---

## 🚀 Start All Services (Development)

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend (Port 5000)
cd femihealth-backend && npm start

# Terminal 3: ML Service (Port 5001)
cd ml-service && python app_41_features.py

# Terminal 4: Frontend (Port 3000)
cd femihealth-frontend && npm run dev
```

**Access**: http://localhost:3000

---

## 📡 API Endpoints

### ML Service (Port 5001)
```
GET  /health           - Health check
GET  /minimal-input    - Required fields info
POST /predict          - PCOS prediction
GET  /features         - All 41 features
```

### Backend (Port 5000)
```
POST /api/prediction/pcos          - Predict PCOS
GET  /api/prediction/health         - ML service health
GET  /api/prediction/minimal-input  - Input requirements
```

---

## 🧪 Quick Test

```bash
# Test ML Service
cd ml-service
python test_prediction.py

# Or manual curl test
curl -X POST http://localhost:5001/predict \
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

---

## 📋 Required User Inputs (10 fields)

1. **Age (yrs)** - 15-50
2. **Weight (Kg)** - 30-200
3. **Height(Cm)** - 120-220
4. **Cycle length(days)** - 20-60
5. **Weight gain(Y/N)** - 0 or 1
6. **hair growth(Y/N)** - 0 or 1
7. **Skin darkening (Y/N)** - 0 or 1
8. **Pimples(Y/N)** - 0 or 1
9. **Fast food (Y/N)** - 0 or 1
10. **Reg.Exercise(Y/N)** - 0 or 1

---

## 🎯 Risk Levels

| Probability | Risk | Color | Action |
|------------|------|-------|--------|
| ≥ 0.7 | HIGH | 🔴 Red | Immediate consultation |
| 0.4-0.69 | MEDIUM | 🟡 Yellow | Schedule check-up |
| < 0.4 | LOW | 🟢 Green | Maintain lifestyle |

---

## 📁 Key Files

### Created/Modified Files
```
✅ ml-service/app_41_features.py          - Main ML service
✅ ml-service/test_prediction.py          - Test script
✅ ml-service/test_samples.json           - Test data
✅ ml-service/README_41_FEATURES.md       - ML docs

✅ femihealth-backend/src/routes/prediction.js  - Prediction routes
✅ femihealth-backend/src/server.js             - Updated routes

✅ femihealth-frontend/src/pages/PCOSPrediction.jsx  - Prediction form
✅ femihealth-frontend/src/services/api.js           - Updated API

✅ DEPLOYMENT_GUIDE.md                    - Deployment instructions
✅ IMPLEMENTATION_SUMMARY.md              - Complete summary
✅ QUICK_REFERENCE.md                     - This file
```

---

## 🔧 Troubleshooting

### ML Service Won't Start
```bash
# Check artifacts exist
ls ml-service/artifacts/
# Should show: rf_pcos_model.pkl, scaler.pkl

# Reinstall dependencies
cd ml-service
pip install -r requirements_41.txt
```

### Backend Connection Error
```bash
# Check MongoDB running
ps aux | grep mongod

# Check .env file
cat femihealth-backend/.env
# Verify MONGODB_URI and ML_SERVICE_URL
```

### Frontend API Errors
```bash
# Check backend running
curl http://localhost:5000/health

# Check ML service running
curl http://localhost:5001/health
```

---

## 📊 Model Info

- **Algorithm**: Random Forest
- **Features**: 41 total (10 user input + 31 imputed)
- **Accuracy**: ~85-90%
- **ROC-AUC**: ~0.88-0.92

### Top Features
1. Follicle No. (R)
2. Follicle No. (L)
3. hair growth(Y/N)
4. Weight gain(Y/N)
5. Skin darkening (Y/N)

---

## 🌐 Deployment URLs (Production)

```
Frontend:  https://femihealth.netlify.app
Backend:   https://femihealth-api.onrender.com
ML Service: https://femihealth-ml.onrender.com
```

---

## 📞 Support

- **Email**: paula.njenga@strathmore.edu
- **Docs**: See README files in each directory
- **Issues**: Create GitHub issue

---

## ✅ Pre-Submission Checklist

- [ ] All services start without errors
- [ ] Test script passes all tests
- [ ] Frontend form works correctly
- [ ] Predictions return valid results
- [ ] Documentation is complete
- [ ] Code is commented
- [ ] .env.example files created
- [ ] Deployment guide tested

---

**🎓 Ready for Thesis Submission!**

*Last Updated: June 2025*
