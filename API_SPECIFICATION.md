# PCOS Prediction API Specification

**Complete API specification for PCOS risk prediction**

---

## 🎯 Endpoint

```
POST /api/predict/tabular
```

**Base URL:** `http://localhost:5000` (Backend) or `http://localhost:5001` (ML Service)

---

## 📥 Request Format

### Headers

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>  // Required for backend API only
```

### Request Body

```json
{
  "beta_hcg_i": 494.08,
  "beta_hcg_ii": 494.08,
  "amh": 6.63
}
```

### Field Specifications

| Field | Type | Required | Min | Max | Unit | Decimals | Description |
|-------|------|----------|-----|-----|------|----------|-------------|
| `beta_hcg_i` | Float | ✅ Yes | 0.1 | 10000.0 | mIU/mL | 2 | First β-hCG measurement |
| `beta_hcg_ii` | Float | ✅ Yes | 0.1 | 10000.0 | mIU/mL | 2 | Second β-hCG measurement |
| `amh` | Float | ✅ Yes | 0.1 | 20.0 | ng/mL | 2 | Anti-Müllerian Hormone level |

---

## 📤 Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "prediction": {
    "_id": "67123abc456def789",
    "user": "66f123abc456def789",
    "type": "tabular",
    "inputData": {
      "beta_hcg_i": 494.08,
      "beta_hcg_ii": 494.08,
      "amh": 6.63
    },
    "result": {
      "prediction": "positive",
      "confidence": 0.87,
      "probability": 0.82,
      "riskLevel": "high",
      "riskScore": 0.82,
      "details": {
        "message": "Based on the provided hormonal markers, the PCOS risk is high",
        "factors": [
          "β-hCG I levels",
          "β-hCG II levels",
          "AMH (Anti-Müllerian Hormone)"
        ],
        "values": {
          "beta_hcg_i": 494.08,
          "beta_hcg_ii": 494.08,
          "amh": 6.63,
          "hcg_ratio": 1.0,
          "hcg_difference": 0.0,
          "hcg_sum": 988.16
        }
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
      },
      {
        "category": "Lifestyle",
        "title": "Maintain Healthy Weight",
        "description": "Regular exercise and balanced diet can help manage PCOS symptoms and improve hormonal balance.",
        "priority": "medium"
      },
      {
        "category": "Monitoring",
        "title": "Regular Follow-ups",
        "description": "Schedule regular check-ups to monitor your hormonal levels and PCOS symptoms.",
        "priority": "medium"
      }
    ],
    "status": "completed",
    "processedAt": "2025-10-21T06:32:53.123Z",
    "createdAt": "2025-10-21T06:32:52.456Z",
    "updatedAt": "2025-10-21T06:32:53.123Z"
  }
}
```

### Response Fields

#### Prediction Levels

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `prediction` | String | `"positive"`, `"negative"`, `"uncertain"` | PCOS prediction label |
| `confidence` | Float | 0.0 - 1.0 | Model confidence in prediction |
| `probability` | Float | 0.0 - 1.0 | Probability of PCOS |
| `riskLevel` | String | `"low"`, `"medium"`, `"high"` | Risk categorization |
| `riskScore` | Float | 0.0 - 1.0 | Numerical risk score |

#### Risk Level Mapping

| Risk Level | Probability Range | Color | Prediction |
|------------|------------------|-------|------------|
| `low` | < 0.4 (< 40%) | 🟢 Green | `negative` |
| `medium` | 0.4 - 0.7 (40-70%) | 🟡 Yellow | `uncertain` |
| `high` | ≥ 0.7 (≥ 70%) | 🔴 Red | `positive` |

---

## ❌ Error Responses

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "beta_hcg_i must be between 0.1 and 10000.0 mIU/mL",
    "amh is required"
  ]
}
```

### Authentication Error (401 Unauthorized)

```json
{
  "message": "Not authorized, no token"
}
```

### ML Service Unavailable (503 Service Unavailable)

```json
{
  "success": false,
  "error": "Model not loaded",
  "message": "Please train the model first using train_model.py"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Server error",
  "error": "Detailed error message"
}
```

---

## 📝 Example Requests

### Example 1: High Risk Case

**Request:**
```bash
curl -X POST http://localhost:5000/api/predict/tabular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "beta_hcg_i": 494.08,
    "beta_hcg_ii": 494.08,
    "amh": 6.63
  }'
```

**Response:**
- `prediction`: "positive"
- `riskLevel`: "high"
- `probability`: ~0.82

### Example 2: Low Risk Case

**Request:**
```bash
curl -X POST http://localhost:5000/api/predict/tabular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "beta_hcg_i": 45.20,
    "beta_hcg_ii": 120.50,
    "amh": 2.10
  }'
```

**Response:**
- `prediction`: "negative"
- `riskLevel`: "low"
- `probability`: ~0.25

### Example 3: Medium Risk Case

**Request:**
```bash
curl -X POST http://localhost:5000/api/predict/tabular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "beta_hcg_i": 85.50,
    "beta_hcg_ii": 210.30,
    "amh": 4.20
  }'
```

**Response:**
- `prediction`: "uncertain"
- `riskLevel`: "medium"
- `probability`: ~0.55

---

## 🧪 Test Cases

### Valid Inputs

```json
// Minimum values
{"beta_hcg_i": 0.1, "beta_hcg_ii": 0.1, "amh": 0.1}

// Maximum values
{"beta_hcg_i": 10000.0, "beta_hcg_ii": 10000.0, "amh": 20.0}

// Typical values
{"beta_hcg_i": 494.08, "beta_hcg_ii": 494.08, "amh": 6.63}

// Low risk values
{"beta_hcg_i": 45.20, "beta_hcg_ii": 120.50, "amh": 2.10}

// High risk values
{"beta_hcg_i": 150.00, "beta_hcg_ii": 350.00, "amh": 8.50}
```

### Invalid Inputs

```json
// Missing field
{"beta_hcg_i": 494.08, "beta_hcg_ii": 494.08}
// Error: "amh is required"

// Value too low
{"beta_hcg_i": 0.05, "beta_hcg_ii": 494.08, "amh": 6.63}
// Error: "beta_hcg_i must be between 0.1 and 10000.0 mIU/mL"

// Value too high
{"beta_hcg_i": 494.08, "beta_hcg_ii": 494.08, "amh": 25.0}
// Error: "amh must be between 0.1 and 20.0 ng/mL"

// Invalid type
{"beta_hcg_i": "invalid", "beta_hcg_ii": 494.08, "amh": 6.63}
// Error: "beta_hcg_i must be a number"

// Negative value
{"beta_hcg_i": -10.0, "beta_hcg_ii": 494.08, "amh": 6.63}
// Error: "beta_hcg_i must be between 0.1 and 10000.0 mIU/mL"
```

---

## 🔐 Authentication

### Get JWT Token

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@femihealth.com",
    "password": "Patient123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjEyM2FiYzQ1NmRlZjc4OSIsImlhdCI6MTcyOTQ4MzIwMCwiZXhwIjoxNzMwMDg4MDAwfQ.abcdef123456...",
    "user": {
      "id": "66f123abc456def789",
      "name": "Jane Doe",
      "email": "patient@femihealth.com",
      "role": "user",
      "emailVerified": true
    }
  }
}
```

### Use Token in Requests

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:5000/api/predict/tabular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"beta_hcg_i": 494.08, "beta_hcg_ii": 494.08, "amh": 6.63}'
```

---

## 📊 Rate Limiting

- **Rate Limit:** 100 requests per 15 minutes per user
- **Header:** `X-RateLimit-Remaining`
- **Response:** 429 Too Many Requests if exceeded

---

## 🔄 Versioning

**Current Version:** v1  
**Base Path:** `/api/predict/tabular`

Future versions will use: `/api/v2/predict/tabular`

---

## 📚 Additional Endpoints

### Get Prediction History

```bash
GET /api/predict/history?page=1&limit=10
Authorization: Bearer <token>
```

### Get Specific Prediction

```bash
GET /api/predict/result/:id
Authorization: Bearer <token>
```

### Health Check (ML Service)

```bash
GET http://localhost:5001/health
```

### Model Information (ML Service)

```bash
GET http://localhost:5001/model/info
```

---

## 🛠️ Development Tools

### Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "FemiHealth PCOS Prediction API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"patient@femihealth.com\",\"password\":\"Patient123!\"}"
        }
      }
    },
    {
      "name": "Predict PCOS Risk",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/predict/tabular",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"beta_hcg_i\":494.08,\"beta_hcg_ii\":494.08,\"amh\":6.63}"
        }
      }
    }
  ]
}
```

### Python Client Example

```python
import requests

# Login
login_response = requests.post(
    'http://localhost:5000/api/auth/login',
    json={'email': 'patient@femihealth.com', 'password': 'Patient123!'}
)
token = login_response.json()['data']['token']

# Make prediction
prediction_response = requests.post(
    'http://localhost:5000/api/predict/tabular',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'beta_hcg_i': 494.08,
        'beta_hcg_ii': 494.08,
        'amh': 6.63
    }
)

result = prediction_response.json()
print(f"Risk Level: {result['prediction']['result']['riskLevel']}")
print(f"Probability: {result['prediction']['result']['probability']:.2%}")
```

### JavaScript/Node.js Client Example

```javascript
const axios = require('axios');

async function predictPCOS() {
  // Login
  const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'patient@femihealth.com',
    password: 'Patient123!'
  });
  
  const token = loginResponse.data.data.token;
  
  // Make prediction
  const predictionResponse = await axios.post(
    'http://localhost:5000/api/predict/tabular',
    {
      beta_hcg_i: 494.08,
      beta_hcg_ii: 494.08,
      amh: 6.63
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  const result = predictionResponse.data.prediction.result;
  console.log(`Risk Level: ${result.riskLevel}`);
  console.log(`Probability: ${(result.probability * 100).toFixed(1)}%`);
}

predictPCOS();
```

---

## 📞 Support

**Issues?**
- Check validation rules
- Verify authentication token
- Ensure ML service is running
- Check request format matches specification

**Documentation:**
- API_SPECIFICATION.md (this file)
- COLAB_DEPLOYMENT_GUIDE.md
- ML_SETUP_GUIDE.md

---

*Last updated: October 21, 2025 at 06:32 EAT*
