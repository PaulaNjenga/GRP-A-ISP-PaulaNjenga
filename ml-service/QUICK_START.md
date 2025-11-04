# Quick Start - ML Service

## Issue: Numpy/Pandas Compatibility Error

You're seeing this error:
```
ValueError: numpy.dtype size changed, may indicate binary incompatibility
```

This happens when numpy and pandas versions don't match.

---

## Solution: Fix Dependencies

### Option 1: Reinstall Dependencies (Recommended)

```bash
cd /home/ongera/projects/femiHealth/ml-service

# Uninstall conflicting packages
pip3 uninstall -y numpy pandas scikit-learn

# Reinstall with compatible versions
pip3 install numpy==1.24.3 pandas==2.1.4 scikit-learn==1.3.2
```

### Option 2: Use Virtual Environment (Best Practice)

```bash
cd /home/ongera/projects/femiHealth/ml-service

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements_41.txt

# Run the service
python app_41_features.py
```

---

## Start ML Service

After fixing dependencies:

```bash
cd /home/ongera/projects/femiHealth/ml-service
python3 app_41_features.py
```

You should see:
```
✓ Feature columns loaded: 41 features
✓ Random Forest model loaded from artifacts/rf_pcos_model.pkl
✓ Scaler loaded from artifacts/scaler.pkl
✓ CNN ultrasound model loaded from artifacts/cnn_ultrasound_model.h5

 * Running on http://127.0.0.1:5001
```

---

## Test the Service

### 1. Health Check
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "scaler_loaded": true,
  "cnn_loaded": true,
  "features_count": 41
}
```

### 2. Test Prediction
```bash
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

### 3. Run Test Script
```bash
python3 test_prediction.py
```

---

## Verify Artifacts

Check that all required files exist:

```bash
ls -lh artifacts/
```

Should show:
```
✓ rf_pcos_model.pkl      (trained Random Forest model)
✓ scaler.pkl             (feature scaler)
✓ feature_cols.json      (41 feature names)
✓ cnn_ultrasound_model.h5 (optional CNN model)
```

---

## Full System Test

### Terminal 1: MongoDB
```bash
mongod
```

### Terminal 2: Backend
```bash
cd /home/ongera/projects/femiHealth/femihealth-backend
npm start
```

### Terminal 3: ML Service
```bash
cd /home/ongera/projects/femiHealth/ml-service
python3 app_41_features.py
```

### Terminal 4: Frontend
```bash
cd /home/ongera/projects/femiHealth/femihealth-frontend
npm run dev
```

### Test in Browser
1. Go to: http://localhost:3000
2. Login/Register
3. Navigate to: http://localhost:3000/pcos-prediction
4. Fill the form and submit
5. View results!

---

## Troubleshooting

### Error: "Module not found"
```bash
pip3 install -r requirements_41.txt
```

### Error: "Port 5001 already in use"
```bash
# Find and kill the process
lsof -ti:5001 | xargs kill -9

# Or change port in app_41_features.py
# app.run(debug=True, port=5002)
```

### Error: "Artifacts not found"
Make sure you're in the ml-service directory:
```bash
pwd  # Should show: /home/ongera/projects/femiHealth/ml-service
ls artifacts/  # Should show the .pkl and .h5 files
```

---

## Success Indicators

✅ ML service starts without errors  
✅ Health endpoint returns 200 OK  
✅ Test prediction returns risk score  
✅ Frontend form submits successfully  
✅ Results display with recommendations  

---

**Once the ML service is running, your predictions will work end-to-end!** 🎉
