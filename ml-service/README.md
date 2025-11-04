# PCOS ML Prediction Service

Machine Learning service for PCOS (Polycystic Ovary Syndrome) risk prediction based on hormonal markers.

## Features

- **β-hCG I**: First Beta-human chorionic gonadotropin measurement (mIU/mL)
- **β-hCG II**: Second Beta-human chorionic gonadotropin measurement (mIU/mL)
- **AMH**: Anti-Müllerian Hormone level (ng/mL)

## Quick Start

### 1. Install Dependencies

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Prepare Your Data

Create a CSV file at `data/pcos_data.csv` with the following columns:

```csv
beta_hcg_i,beta_hcg_ii,amh,pcos
45.2,120.5,2.1,0
110.3,280.7,5.8,1
...
```

Where:
- `beta_hcg_i`: First β-hCG measurement
- `beta_hcg_ii`: Second β-hCG measurement
- `amh`: AMH level
- `pcos`: Target variable (0 = No PCOS, 1 = PCOS)

**Note:** If you don't have data yet, the training script will create a synthetic dataset for demonstration.

### 3. Train the Model

```bash
python train_model.py
```

This will:
- Load your data (or create synthetic data)
- Preprocess and engineer features
- Train multiple ML models (Logistic Regression, Random Forest, Gradient Boosting)
- Select the best model based on ROC-AUC score
- Save the model, scaler, and metadata to `models/` directory

Expected output:
```
✓ Model trained successfully
✓ Accuracy: 0.8500
✓ ROC-AUC: 0.9200
✓ Files saved to models/
```

### 4. Start the Flask Service

```bash
python app.py
```

The service will start on `http://localhost:5001`

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "PCOS ML Prediction Service",
  "model_loaded": true,
  "timestamp": "2025-10-21T06:24:00"
}
```

### Model Information
```bash
GET /model/info
```

Response:
```json
{
  "model_name": "Random Forest",
  "training_date": "2025-10-21T06:20:00",
  "features": ["beta_hcg_i", "beta_hcg_ii", "amh", "hcg_ratio", "hcg_difference", "hcg_sum"],
  "metrics": {
    "accuracy": 0.85,
    "precision": 0.83,
    "recall": 0.87,
    "f1_score": 0.85,
    "roc_auc": 0.92
  }
}
```

### Single Prediction
```bash
POST /predict
Content-Type: application/json

{
  "beta_hcg_i": 85.5,
  "beta_hcg_ii": 210.3,
  "amh": 4.2
}
```

Response:
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
  "recommendations": [
    {
      "category": "Medical",
      "title": "Consult a Healthcare Provider",
      "description": "Schedule an appointment with a gynecologist...",
      "priority": "high"
    }
  ]
}
```

### Batch Prediction
```bash
POST /predict/batch
Content-Type: application/json

{
  "samples": [
    {"beta_hcg_i": 85.5, "beta_hcg_ii": 210.3, "amh": 4.2},
    {"beta_hcg_i": 45.2, "beta_hcg_ii": 120.5, "amh": 2.1}
  ]
}
```

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5001/health

# Get model info
curl http://localhost:5001/model/info

# Make prediction
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "beta_hcg_i": 85.5,
    "beta_hcg_ii": 210.3,
    "amh": 4.2
  }'
```

### Using Python

```python
import requests

# Make prediction
response = requests.post('http://localhost:5001/predict', json={
    'beta_hcg_i': 85.5,
    'beta_hcg_ii': 210.3,
    'amh': 4.2
})

result = response.json()
print(f"Risk Level: {result['risk_level']}")
print(f"Probability: {result['probability']:.2%}")
```

## Model Training Details

### Feature Engineering

The model automatically engineers the following features:
- `hcg_ratio`: β-hCG II / β-hCG I (progression rate)
- `hcg_difference`: β-hCG II - β-hCG I (absolute change)
- `hcg_sum`: β-hCG I + β-hCG II (total hormone level)

### Models Trained

1. **Logistic Regression**: Fast, interpretable baseline
2. **Random Forest**: Ensemble method, handles non-linear relationships
3. **Gradient Boosting**: Advanced ensemble, often best performance

The best model is automatically selected based on ROC-AUC score.

### Evaluation Metrics

- **Accuracy**: Overall correct predictions
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)
- **F1 Score**: Harmonic mean of precision and recall
- **ROC-AUC**: Area under the ROC curve (0.5 = random, 1.0 = perfect)

## Risk Levels

- **Low Risk** (probability < 0.4): Green
- **Medium Risk** (0.4 ≤ probability < 0.7): Yellow
- **High Risk** (probability ≥ 0.7): Red

## Directory Structure

```
ml-service/
├── app.py                 # Flask API service
├── train_model.py         # Model training script
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── data/
│   └── pcos_data.csv     # Training data (you provide this)
└── models/
    ├── pcos_model_latest.joblib    # Trained model
    ├── scaler_latest.joblib        # Feature scaler
    └── metadata_latest.json        # Model metadata
```

## Integration with Node.js Backend

Update `femihealth-backend/src/controllers/predictionController.js`:

```javascript
import axios from 'axios';

const performMLPrediction = async (data, type) => {
  try {
    const response = await axios.post(
      'http://localhost:5001/predict',
      {
        beta_hcg_i: data.beta_hcg_i,
        beta_hcg_ii: data.beta_hcg_ii,
        amh: data.amh
      },
      { timeout: 30000 }
    );
    return response.data;
  } catch (error) {
    console.error('ML service error:', error);
    throw new Error('Prediction service unavailable');
  }
};
```

## Troubleshooting

### Model not loading
```bash
# Train the model first
python train_model.py

# Check if model files exist
ls -la models/
```

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### Port already in use
```bash
# Change port in app.py
app.run(host='0.0.0.0', port=5002, debug=True)
```

## Production Deployment

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5001
CMD ["python", "app.py"]
```

Build and run:
```bash
docker build -t pcos-ml-service .
docker run -p 5001:5001 pcos-ml-service
```

### Using Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## Next Steps

1. **Collect Real Data**: Replace synthetic data with actual patient data
2. **Improve Model**: Try different algorithms, hyperparameter tuning
3. **Add Features**: Include more clinical markers if available
4. **Monitor Performance**: Track prediction accuracy in production
5. **A/B Testing**: Compare model versions

## Support

For issues or questions:
- Check model training output for errors
- Verify data format matches expected schema
- Test API endpoints with curl
- Check Flask logs for error messages

---

**⚠️ Medical Disclaimer**: This tool is for research and educational purposes only. It should not replace professional medical diagnosis or treatment.
