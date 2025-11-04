# Google Colab Model Deployment Guide

**Complete guide to deploy your Colab-trained PCOS prediction model**

---

## 📋 Overview

This guide shows you how to:
1. Train your model in Google Colab
2. Download the model artifacts
3. Deploy them to your Flask ML service
4. Test the predictions

---

## 🎯 Step 1: Train Model in Google Colab

### Expected Artifacts from Colab

Your Colab notebook should produce these files:
```
pcos_model.joblib          # Trained model (RandomForest/GradientBoosting/etc.)
scaler.joblib              # StandardScaler for feature normalization
metadata.json              # Model information and metrics
```

### Metadata JSON Format

Your `metadata.json` should contain:
```json
{
  "model_name": "Random Forest",
  "features": [
    "beta_hcg_i",
    "beta_hcg_ii", 
    "amh",
    "hcg_ratio",
    "hcg_difference",
    "hcg_sum"
  ],
  "training_date": "2025-10-21T06:32:00",
  "training_samples": 800,
  "test_samples": 200,
  "metrics": {
    "accuracy": 0.8850,
    "precision": 0.8756,
    "recall": 0.8975,
    "f1_score": 0.8864,
    "roc_auc": 0.9456
  },
  "feature_ranges": {
    "beta_hcg_i": {"min": 0.1, "max": 10000.0},
    "beta_hcg_ii": {"min": 0.1, "max": 10000.0},
    "amh": {"min": 0.1, "max": 20.0}
  }
}
```

---

## 📥 Step 2: Download Artifacts from Colab

### In Your Colab Notebook

Add this code at the end of your training notebook:

```python
import joblib
import json
from datetime import datetime

# Save model
joblib.dump(model, 'pcos_model.joblib')
print("✓ Model saved")

# Save scaler
joblib.dump(scaler, 'scaler.joblib')
print("✓ Scaler saved")

# Save metadata
metadata = {
    'model_name': 'Random Forest',  # or your model name
    'features': [
        'beta_hcg_i', 'beta_hcg_ii', 'amh',
        'hcg_ratio', 'hcg_difference', 'hcg_sum'
    ],
    'training_date': datetime.now().isoformat(),
    'training_samples': len(X_train),
    'test_samples': len(X_test),
    'metrics': {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'roc_auc': float(roc_auc)
    },
    'feature_ranges': {
        'beta_hcg_i': {'min': 0.1, 'max': 10000.0},
        'beta_hcg_ii': {'min': 0.1, 'max': 10000.0},
        'amh': {'min': 0.1, 'max': 20.0}
    }
}

with open('metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("✓ Metadata saved")

# Download files
from google.colab import files

files.download('pcos_model.joblib')
files.download('scaler.joblib')
files.download('metadata.json')

print("\n✓ All artifacts ready for download!")
```

---

## 📂 Step 3: Deploy Artifacts to Flask Service

### Copy Files to ML Service

```bash
# Navigate to your project
cd /home/ongera/projects/femiHealth/ml-service

# Create models directory if it doesn't exist
mkdir -p models

# Copy your downloaded files
cp ~/Downloads/pcos_model.joblib models/pcos_model_latest.joblib
cp ~/Downloads/scaler.joblib models/scaler_latest.joblib
cp ~/Downloads/metadata.json models/metadata_latest.json

# Verify files
ls -lh models/
```

Expected output:
```
-rw-r--r-- 1 user user  2.1M Oct 21 06:32 pcos_model_latest.joblib
-rw-r--r-- 1 user user  1.2K Oct 21 06:32 scaler_latest.joblib
-rw-r--r-- 1 user user  856B Oct 21 06:32 metadata_latest.json
```

---

## 🚀 Step 4: Start the ML Service

### Install Dependencies (First Time Only)

```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Start Flask Service

```bash
# Make sure you're in ml-service directory with venv activated
python app.py
```

**Expected Output:**
```
============================================================
PCOS ML PREDICTION SERVICE
============================================================
✓ Model loaded: Random Forest
✓ Training date: 2025-10-21T06:32:00
✓ Model metrics:
  - accuracy: 0.8850
  - precision: 0.8756
  - recall: 0.8975
  - f1_score: 0.8864
  - roc_auc: 0.9456

✓ Service ready!
✓ Starting Flask server on http://localhost:5001
============================================================

 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5001
```

---

## 🧪 Step 5: Test the Deployment

### Test 1: Health Check

```bash
curl http://localhost:5001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "PCOS ML Prediction Service",
  "model_loaded": true,
  "timestamp": "2025-10-21T06:32:53"
}
```

### Test 2: Model Information

```bash
curl http://localhost:5001/model/info
```

**Expected Response:**
```json
{
  "model_name": "Random Forest",
  "training_date": "2025-10-21T06:32:00",
  "features": ["beta_hcg_i", "beta_hcg_ii", "amh", "hcg_ratio", "hcg_difference", "hcg_sum"],
  "metrics": {
    "accuracy": 0.8850,
    "precision": 0.8756,
    "recall": 0.8975,
    "f1_score": 0.8864,
    "roc_auc": 0.9456
  },
  "feature_ranges": {
    "beta_hcg_i": {"min": 0.1, "max": 10000.0},
    "beta_hcg_ii": {"min": 0.1, "max": 10000.0},
    "amh": {"min": 0.1, "max": 20.0}
  }
}
```

### Test 3: Make Prediction (Your Example)

```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "beta_hcg_i": 494.08,
    "beta_hcg_ii": 494.08,
    "amh": 6.63
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "prediction": "positive",
  "confidence": 0.87,
  "probability": 0.82,
  "risk_score": 0.82,
  "risk_level": "high",
  "risk_color": "red",
  "details": {
    "message": "Based on the provided hormonal markers, the PCOS risk is high",
    "factors": ["β-hCG I levels", "β-hCG II levels", "AMH (Anti-Müllerian Hormone)"],
    "values": {
      "beta_hcg_i": 494.08,
      "beta_hcg_ii": 494.08,
      "amh": 6.63,
      "hcg_ratio": 1.0,
      "hcg_difference": 0.0,
      "hcg_sum": 988.16
    }
  },
  "recommendations": [
    {
      "category": "Medical",
      "title": "Consult a Healthcare Provider",
      "description": "Schedule an appointment with a gynecologist or endocrinologist for proper diagnosis and treatment.",
      "priority": "high"
    },
    {
      "category": "Hormonal",
      "title": "Elevated AMH Levels Detected",
      "description": "Your AMH levels are elevated, which may indicate PCOS. Discuss hormone therapy options with your doctor.",
      "priority": "high"
    }
  ],
  "model_info": {
    "model_name": "Random Forest",
    "accuracy": 0.8850
  },
  "timestamp": "2025-10-21T06:32:53"
}
```

---

## 🔗 Step 6: Test Full Integration

### Start All Services

**Terminal 1 - ML Service:**
```bash
cd ml-service
source venv/bin/activate
python app.py
# Running on http://localhost:5001
```

**Terminal 2 - Backend:**
```bash
cd femihealth-backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 3 - Frontend:**
```bash
cd femihealth-frontend
npm run dev
# Running on http://localhost:3000
```

### Test Through Backend API

```bash
# Login to get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@femihealth.com","password":"Patient123!"}' \
  | jq -r '.data.token')

# Make prediction through backend
curl -X POST http://localhost:5000/api/predict/tabular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "beta_hcg_i": 494.08,
    "beta_hcg_ii": 494.08,
    "amh": 6.63
  }'
```

### Test Through Frontend

1. Open browser: http://localhost:3000
2. Login: `patient@femihealth.com` / `Patient123!`
3. Navigate to Prediction Form
4. Enter your test values:
   - β-hCG I: 494.08
   - β-hCG II: 494.08
   - AMH: 6.63
5. Click "Get PCOS Risk Score"
6. View results! 🎉

---

## ✅ Validation Rules (Enforced)

### Input Ranges

| Field | Min | Max | Unit | Decimals |
|-------|-----|-----|------|----------|
| `beta_hcg_i` | 0.1 | 10000.0 | mIU/mL | 2 |
| `beta_hcg_ii` | 0.1 | 10000.0 | mIU/mL | 2 |
| `amh` | 0.1 | 20.0 | ng/mL | 2 |

### Validation Examples

**✅ Valid:**
```json
{"beta_hcg_i": 494.08, "beta_hcg_ii": 494.08, "amh": 6.63}
{"beta_hcg_i": 0.1, "beta_hcg_ii": 0.1, "amh": 0.1}
{"beta_hcg_i": 10000.0, "beta_hcg_ii": 10000.0, "amh": 20.0}
```

**❌ Invalid:**
```json
{"beta_hcg_i": 0.05, "beta_hcg_ii": 494.08, "amh": 6.63}  // beta_hcg_i too low
{"beta_hcg_i": 494.08, "beta_hcg_ii": 494.08, "amh": 25.0}  // amh too high
{"beta_hcg_i": 494.08, "beta_hcg_ii": 494.08}  // missing amh
{"beta_hcg_i": "invalid", "beta_hcg_ii": 494.08, "amh": 6.63}  // not a number
```

---

## 🔧 Troubleshooting

### Issue: Model files not found

**Error:**
```
⚠ Model not found. Please train the model first using train_model.py
```

**Solution:**
```bash
# Check if files exist
ls -la ml-service/models/

# Files should be named exactly:
# - pcos_model_latest.joblib
# - scaler_latest.joblib
# - metadata_latest.json

# If files have different names, rename them:
cd ml-service/models
mv your_model.joblib pcos_model_latest.joblib
mv your_scaler.joblib scaler_latest.joblib
mv your_metadata.json metadata_latest.json
```

### Issue: Model version mismatch

**Error:**
```
ModuleNotFoundError: No module named 'sklearn.ensemble._forest'
```

**Solution:**
```bash
# Check scikit-learn version in Colab
# In Colab: print(sklearn.__version__)

# Install same version locally
pip install scikit-learn==1.3.0  # Match Colab version
```

### Issue: Feature mismatch

**Error:**
```
ValueError: X has 3 features, but model expects 6 features
```

**Solution:**
- Your model was trained with 6 features (including engineered features)
- The Flask service automatically engineers features
- Check that `engineer_features()` function matches your Colab preprocessing

### Issue: Validation errors

**Error:**
```
Invalid value for amh: must be between 0.1 and 20.0 ng/mL
```

**Solution:**
- Check input values are within valid ranges
- Ensure values are numbers, not strings
- Values are automatically rounded to 2 decimal places

---

## 📊 Model Performance Monitoring

### Log Predictions

Add to your backend to track predictions:

```javascript
// In predictionController.js after saving prediction
console.log('Prediction made:', {
  user: req.user.email,
  input: inputData,
  result: result.prediction,
  confidence: result.confidence,
  timestamp: new Date()
});
```

### Track Accuracy

Create a feedback system:
1. Doctors review predictions
2. Mark as correct/incorrect
3. Calculate accuracy over time
4. Retrain when accuracy drops

---

## 🔄 Updating the Model

### When to Retrain

- Accuracy drops below 85%
- New data available (500+ samples)
- Every 3-6 months
- After significant changes in patient demographics

### Update Process

1. **Train new model in Colab**
2. **Download new artifacts**
3. **Backup old model:**
   ```bash
   cd ml-service/models
   cp pcos_model_latest.joblib pcos_model_backup_$(date +%Y%m%d).joblib
   ```
4. **Deploy new artifacts**
5. **Test thoroughly**
6. **Monitor performance**

---

## 📁 File Structure

```
ml-service/
├── app.py                              # Flask service
├── requirements.txt                    # Dependencies
├── COLAB_DEPLOYMENT_GUIDE.md          # This file
├── models/
│   ├── pcos_model_latest.joblib       # Your Colab model ← PLACE HERE
│   ├── scaler_latest.joblib           # Your Colab scaler ← PLACE HERE
│   └── metadata_latest.json           # Your Colab metadata ← PLACE HERE
└── venv/                              # Virtual environment
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Model trained in Colab
- [ ] Artifacts downloaded (3 files)
- [ ] Files copied to `ml-service/models/`
- [ ] Files renamed to `*_latest.joblib` and `*_latest.json`
- [ ] Virtual environment created
- [ ] Dependencies installed

### Testing
- [ ] ML service starts without errors
- [ ] Health check responds
- [ ] Model info displays correctly
- [ ] Test prediction works
- [ ] Validation rules enforced
- [ ] Backend connects to ML service
- [ ] Frontend displays predictions

### Production
- [ ] Model performance acceptable (ROC-AUC > 0.85)
- [ ] All validation rules working
- [ ] Error handling tested
- [ ] Logging configured
- [ ] Backup strategy in place

---

## 🎉 Success!

Your Colab-trained model is now deployed and ready to make predictions!

**Test with your example:**
```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"beta_hcg_i": 494.08, "beta_hcg_ii": 494.08, "amh": 6.63}'
```

---

**Questions? Issues?**
- Check the troubleshooting section
- Verify file names match exactly
- Ensure scikit-learn versions match
- Test each component individually

*Last updated: October 21, 2025 at 06:32 EAT*
