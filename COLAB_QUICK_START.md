# 🚀 Colab Model Deployment - Quick Start

**Get your Colab-trained model running in 5 minutes!**

---

## ✅ What You Need

From your Google Colab training:
- ✅ `pcos_model.joblib` (trained model)
- ✅ `scaler.joblib` (feature scaler)
- ✅ `metadata.json` (model info)

---

## 📥 Step 1: Download from Colab

Add this to your Colab notebook:

```python
# At the end of your training notebook
import joblib
from google.colab import files

# Download artifacts
files.download('pcos_model.joblib')
files.download('scaler.joblib')
files.download('metadata.json')
```

---

## 📂 Step 2: Copy Files

```bash
cd /home/ongera/projects/femiHealth/ml-service/models

# Copy your downloaded files
cp ~/Downloads/pcos_model.joblib pcos_model_latest.joblib
cp ~/Downloads/scaler.joblib scaler_latest.joblib
cp ~/Downloads/metadata.json metadata_latest.json

# Verify
ls -lh
```

---

## 🚀 Step 3: Start Services

### Terminal 1 - ML Service
```bash
cd ml-service
source venv/bin/activate
python app.py
```

### Terminal 2 - Backend
```bash
cd femihealth-backend
npm run dev
```

### Terminal 3 - Frontend
```bash
cd femihealth-frontend
npm run dev
```

---

## 🧪 Step 4: Test

```bash
# Test ML service directly
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "beta_hcg_i": 494.08,
    "beta_hcg_ii": 494.08,
    "amh": 6.63
  }'
```

**Or visit:** http://localhost:3000 and use the form!

---

## 📊 Your Input Format

```json
{
  "beta_hcg_i": 494.08,    // 0.1 - 10000.0 mIU/mL
  "beta_hcg_ii": 494.08,   // 0.1 - 10000.0 mIU/mL
  "amh": 6.63              // 0.1 - 20.0 ng/mL
}
```

---

## ✅ Success Checklist

- [ ] 3 files copied to `ml-service/models/`
- [ ] Files renamed to `*_latest.*`
- [ ] ML service starts without errors
- [ ] Test prediction returns results
- [ ] Backend connects to ML service
- [ ] Frontend displays predictions

---

## 🐛 Quick Fixes

**Model not loading?**
```bash
# Check file names
ls ml-service/models/
# Must be: pcos_model_latest.joblib, scaler_latest.joblib, metadata_latest.json
```

**Port in use?**
```bash
# Kill process
lsof -i :5001
kill -9 <PID>
```

**Import errors?**
```bash
# Reinstall dependencies
cd ml-service
pip install -r requirements.txt
```

---

## 📚 Full Documentation

- **COLAB_DEPLOYMENT_GUIDE.md** - Complete guide
- **API_SPECIFICATION.md** - API format
- **ML_SETUP_GUIDE.md** - Training details

---

**🎉 Done! Your model is live!**

Test at: http://localhost:3000

*Questions? Check COLAB_DEPLOYMENT_GUIDE.md*
