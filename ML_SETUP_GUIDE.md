# ML Model Training & Deployment Guide

**Complete guide to train and deploy the PCOS prediction model**

---

## 📋 Overview

This guide will help you:
1. Prepare your training data
2. Train the ML model
3. Deploy the Flask ML service
4. Integrate with the Node.js backend
5. Test the complete system

---

## 🎯 Step 1: Prepare Your Training Data

### Option A: Use Your Own Data

Create a CSV file at `ml-service/data/pcos_data.csv` with your actual patient data:

```csv
beta_hcg_i,beta_hcg_ii,amh,pcos
45.2,120.5,2.1,0
110.3,280.7,5.8,1
62.8,155.3,3.2,0
95.4,245.1,4.9,1
...
```

**Column Descriptions:**
- `beta_hcg_i`: First β-hCG measurement (mIU/mL) - numeric
- `beta_hcg_ii`: Second β-hCG measurement (mIU/mL) - numeric
- `amh`: Anti-Müllerian Hormone level (ng/mL) - numeric
- `pcos`: Target variable - 0 (No PCOS) or 1 (PCOS)

**Data Requirements:**
- Minimum 100 samples recommended (more is better)
- Balanced classes (roughly equal PCOS positive and negative cases)
- No missing values
- All values should be positive numbers

### Option B: Use Synthetic Data (For Testing)

If you don't have data yet, the training script will automatically create synthetic data for demonstration purposes.

---

## 🚀 Step 2: Train the Model

### Install Python Dependencies

```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run Training Script

```bash
python train_model.py
```

**Expected Output:**
```
============================================================
PCOS RISK PREDICTION MODEL TRAINING
============================================================
Started at: 2025-10-21 06:24:00

✓ Data loaded successfully: 1000 samples, 4 features

PREPROCESSING DATA
============================================================
✓ No missing values found
✓ Created engineered features:
  - hcg_ratio: β-hCG II / β-hCG I
  - hcg_difference: β-hCG II - β-hCG I
  - hcg_sum: β-hCG I + β-hCG II

TRAINING MODELS
============================================================

Training Logistic Regression...
  Accuracy:  0.8450
  Precision: 0.8312
  Recall:    0.8625
  F1 Score:  0.8466
  ROC-AUC:   0.9123
  CV Score:  0.9045 (+/- 0.0234)

Training Random Forest...
  Accuracy:  0.8850
  Precision: 0.8756
  Recall:    0.8975
  F1 Score:  0.8864
  ROC-AUC:   0.9456
  CV Score:  0.9378 (+/- 0.0189)

Training Gradient Boosting...
  Accuracy:  0.8750
  Precision: 0.8634
  Recall:    0.8900
  F1 Score:  0.8765
  ROC-AUC:   0.9345
  CV Score:  0.9267 (+/- 0.0212)

============================================================
BEST MODEL: Random Forest
============================================================

MODEL EVALUATION
============================================================

Classification Report:
              precision    recall  f1-score   support

     No PCOS       0.89      0.88      0.88       120
        PCOS       0.88      0.90      0.89       80

    accuracy                           0.89       200
   macro avg       0.88      0.89      0.88       200
weighted avg       0.89      0.89      0.89       200

Confusion Matrix:
                 Predicted
                 No    Yes
Actual No      105     15
Actual Yes       8     72

Feature Importance:
        feature  importance
            amh    0.452341
    beta_hcg_ii    0.234567
     beta_hcg_i    0.156789
      hcg_ratio    0.089234
hcg_difference    0.045678
       hcg_sum    0.021391

SAVING MODEL
============================================================
✓ Model saved: models/pcos_model_20251021_062400.joblib
✓ Scaler saved: models/scaler_20251021_062400.joblib
✓ Metadata saved: models/metadata_20251021_062400.json
✓ Latest versions saved for production use

============================================================
TRAINING COMPLETE!
============================================================

Model Performance:
  Accuracy:  0.8850
  Precision: 0.8756
  Recall:    0.8975
  F1 Score:  0.8864
  ROC-AUC:   0.9456

Files saved:
  - models/pcos_model_20251021_062400.joblib
  - models/scaler_20251021_062400.joblib
  - models/metadata_20251021_062400.json

Ready for deployment! Use 'models/*_latest.joblib' files in Flask app.
```

**What Just Happened:**
1. ✅ Data loaded and preprocessed
2. ✅ Features engineered (ratios, differences, sums)
3. ✅ Three models trained (Logistic Regression, Random Forest, Gradient Boosting)
4. ✅ Best model selected based on ROC-AUC score
5. ✅ Model evaluated on test set
6. ✅ Model, scaler, and metadata saved

---

## 🌐 Step 3: Start the ML Service

### Start Flask Server

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
✓ Training date: 2025-10-21T06:24:00
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

### Test the ML Service

Open a new terminal and test:

```bash
# Health check
curl http://localhost:5001/health

# Model info
curl http://localhost:5001/model/info

# Make a prediction
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "beta_hcg_i": 85.5,
    "beta_hcg_ii": 210.3,
    "amh": 4.2
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
      "beta_hcg_i": 85.5,
      "beta_hcg_ii": 210.3,
      "amh": 4.2,
      "hcg_ratio": 2.46,
      "hcg_difference": 124.8,
      "hcg_sum": 295.8
    }
  },
  "recommendations": [...]
}
```

---

## 🔗 Step 4: Start the Backend & Frontend

### Terminal 1: ML Service (Already Running)
```bash
cd ml-service
source venv/bin/activate
python app.py
# Running on http://localhost:5001
```

### Terminal 2: Backend
```bash
cd femihealth-backend
npm run dev
# Running on http://localhost:5000
```

### Terminal 3: Frontend
```bash
cd femihealth-frontend
npm run dev
# Running on http://localhost:3000
```

---

## 🧪 Step 5: Test the Complete System

### Test 1: Direct ML Service
```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"beta_hcg_i": 85.5, "beta_hcg_ii": 210.3, "amh": 4.2}'
```

### Test 2: Through Node.js Backend
```bash
# Login first to get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@femihealth.com","password":"Patient123!"}' \
  | jq -r '.data.token')

# Make prediction
curl -X POST http://localhost:5000/api/predict/tabular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "beta_hcg_i": 85.5,
    "beta_hcg_ii": 210.3,
    "amh": 4.2
  }'
```

### Test 3: Through Frontend UI

1. Open browser: http://localhost:3000
2. Login with: `patient@femihealth.com` / `Patient123!`
3. Navigate to Prediction Form
4. Enter values:
   - β-hCG I: 85.5
   - β-hCG II: 210.3
   - AMH: 4.2
5. Click "Get PCOS Risk Score"
6. View results!

---

## 📊 Understanding the Results

### Risk Levels

| Risk Level | Probability Range | Color | Meaning |
|------------|------------------|-------|---------|
| **Low** | < 0.4 (< 40%) | 🟢 Green | Low risk of PCOS |
| **Medium** | 0.4 - 0.7 (40-70%) | 🟡 Yellow | Moderate risk, monitoring recommended |
| **High** | ≥ 0.7 (≥ 70%) | 🔴 Red | High risk, medical consultation advised |

### Model Metrics Explained

- **Accuracy**: Overall correct predictions (e.g., 88.5% = 885 out of 1000 correct)
- **Precision**: Of all predicted PCOS cases, how many were actually PCOS
- **Recall**: Of all actual PCOS cases, how many did we catch
- **F1 Score**: Balance between precision and recall
- **ROC-AUC**: Model's ability to distinguish between classes (0.5 = random, 1.0 = perfect)

### Feature Importance

The model considers these factors (in order of importance):
1. **AMH Level** (~45%): Most important indicator
2. **β-hCG II** (~23%): Second β-hCG measurement
3. **β-hCG I** (~16%): First β-hCG measurement
4. **HCG Ratio** (~9%): Progression rate
5. **HCG Difference** (~5%): Absolute change
6. **HCG Sum** (~2%): Total hormone level

---

## 🔧 Troubleshooting

### Issue: Model files not found
```
✗ Model not found. Please train the model first using train_model.py
```

**Solution:**
```bash
cd ml-service
python train_model.py
```

### Issue: ML Service connection error
```
ML Service Error: connect ECONNREFUSED 127.0.0.1:5001
```

**Solution:**
1. Check if ML service is running: `curl http://localhost:5001/health`
2. Start ML service: `python app.py`
3. Check firewall settings

### Issue: Import errors
```
ModuleNotFoundError: No module named 'flask'
```

**Solution:**
```bash
cd ml-service
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Port already in use
```
OSError: [Errno 98] Address already in use
```

**Solution:**
```bash
# Find process using port 5001
lsof -i :5001

# Kill the process
kill -9 <PID>

# Or change port in app.py
app.run(host='0.0.0.0', port=5002, debug=True)
```

### Issue: Backend falls back to mock predictions
```
ML Service Error: timeout of 30000ms exceeded
Falling back to mock prediction...
```

**Solution:**
1. ML service might be slow or unresponsive
2. Check ML service logs
3. Increase timeout in predictionController.js
4. Optimize model (use simpler model or reduce features)

---

## 🚀 Production Deployment

### Option 1: Docker Deployment

Create `ml-service/Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 5001

# Run application
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "app:app"]
```

Build and run:
```bash
cd ml-service
docker build -t pcos-ml-service .
docker run -p 5001:5001 pcos-ml-service
```

### Option 2: Cloud Deployment (AWS, GCP, Azure)

1. **Package the service:**
   ```bash
   cd ml-service
   zip -r ml-service.zip . -x "venv/*" -x "*.pyc"
   ```

2. **Deploy to cloud:**
   - AWS: Elastic Beanstalk or Lambda
   - GCP: Cloud Run or App Engine
   - Azure: App Service or Functions

3. **Update backend `.env`:**
   ```
   ML_SERVICE_URL=https://your-ml-service.cloud.com
   ```

---

## 📈 Improving the Model

### Collect More Data
- Aim for 1000+ samples
- Balance PCOS positive and negative cases
- Include diverse patient demographics

### Add More Features
If available, consider adding:
- Age
- BMI
- Menstrual cycle regularity
- Insulin levels
- Testosterone levels
- Ultrasound findings

### Hyperparameter Tuning
Modify `train_model.py` to add GridSearchCV:
```python
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [10, 20, 30],
    'min_samples_split': [2, 5, 10]
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='roc_auc'
)
grid_search.fit(X_train_scaled, y_train)
best_model = grid_search.best_estimator_
```

### Monitor Performance
Track predictions in production:
- Log all predictions
- Collect feedback from doctors
- Retrain model periodically with new data

---

## ✅ Checklist

### Training
- [ ] Prepared training data (CSV file)
- [ ] Installed Python dependencies
- [ ] Trained model successfully
- [ ] Model files created in `models/` directory
- [ ] Model metrics are acceptable (ROC-AUC > 0.85)

### Deployment
- [ ] ML service starts without errors
- [ ] Health check endpoint responds
- [ ] Test prediction works
- [ ] Backend connects to ML service
- [ ] Frontend displays predictions correctly

### Testing
- [ ] Direct ML service test passes
- [ ] Backend API test passes
- [ ] Frontend UI test passes
- [ ] Results match expected format
- [ ] Recommendations are generated

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review ML service logs
3. Test each component individually
4. Verify data format matches expected schema

---

**🎉 Congratulations! Your ML model is trained and deployed!**

*Last updated: October 21, 2025*
