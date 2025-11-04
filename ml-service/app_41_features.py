"""
FemiHealth PCOS Prediction API - 41 Feature Model with Smart Imputation
Author: Njenga Paula Waithira (143109)
Strathmore University - June 2025 Thesis

This API accepts minimal user input (8-10 fields) and intelligently imputes
the remaining 31 features using training data medians.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import pandas as pd
import numpy as np
import os
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image
import cv2

app = Flask(__name__)
CORS(app)

# ============================================================================
# GLOBAL VARIABLES
# ============================================================================

MODEL = None
SCALER = None
CNN_MODEL = None
FEATURE_COLS = None  # Will be loaded from artifacts

# Training data medians for imputation (from actual PCOS dataset)
TRAINING_MEDIANS = {
    'Age (yrs)': 26.0,
    'Weight (Kg)': 65.0,
    'Height(Cm)': 160.0,
    'BMI': 25.4,
    'Blood Group': 11.0,  # Encoded value
    'Pulse rate(bpm)': 72.0,
    'RR (breaths/min)': 16.0,
    'Hb(g/dl)': 12.5,
    'Cycle(R/I)': 4.0,  # 4=Regular
    'Cycle length(days)': 28.0,
    'Marraige Status (Yrs)': 3.0,
    'Pregnant(Y/N)': 0.0,
    'No. of aborptions': 0.0,
    'I   beta-HCG(mIU/mL)': 1.2,
    'II    beta-HCG(mIU/mL)': 1.4,
    'FSH(mIU/mL)': 6.8,
    'LH(mIU/mL)': 8.2,
    'FSH/LH': 0.83,
    'Hip(inch)': 36.0,
    'Waist(inch)': 32.0,
    'Waist:Hip Ratio': 0.89,
    'TSH (mIU/L)': 2.5,
    'AMH(ng/mL)': 3.5,
    'PRL(ng/mL)': 18.0,
    'Vit D3 (ng/mL)': 22.0,
    'PRG(ng/mL)': 0.8,
    'RBS(mg/dl)': 95.0,
    'Weight gain(Y/N)': 1.0,
    'hair growth(Y/N)': 1.0,
    'Skin darkening (Y/N)': 0.0,
    'Hair loss(Y/N)': 1.0,
    'Pimples(Y/N)': 1.0,
    'Fast food (Y/N)': 1.0,
    'Reg.Exercise(Y/N)': 0.0,
    'BP _Systolic (mmHg)': 120.0,
    'BP _Diastolic (mmHg)': 80.0,
    'Follicle No. (L)': 10.0,
    'Follicle No. (R)': 10.0,
    'Avg. F size (L) (mm)': 8.0,
    'Avg. F size (R) (mm)': 8.0,
    'Endometrium (mm)': 8.0
}

# Minimal required fields from user
MINIMAL_INPUT_FIELDS = [
    'Age (yrs)',
    'Weight (Kg)',
    'Height(Cm)',
    'Cycle length(days)',
    'Weight gain(Y/N)',
    'hair growth(Y/N)',
    'Skin darkening (Y/N)',
    'Pimples(Y/N)',
    'Fast food (Y/N)',
    'Reg.Exercise(Y/N)'
]

# ============================================================================
# MODEL LOADING
# ============================================================================

def load_artifacts():
    """Load trained model, scaler, feature columns, and optional CNN model."""
    global MODEL, SCALER, CNN_MODEL, FEATURE_COLS
    
    try:
        # Load feature columns
        feature_cols_path = 'artifacts/feature_cols.json'
        if os.path.exists(feature_cols_path):
            import pickle
            with open(feature_cols_path, 'rb') as f:
                FEATURE_COLS = pickle.load(f)
            print(f"✓ Feature columns loaded: {len(FEATURE_COLS)} features")
        else:
            print(f"⚠ Feature columns not found at {feature_cols_path}")
            return False
        
        # Load Random Forest model
        model_path = 'artifacts/rf_pcos_model.pkl'
        if os.path.exists(model_path):
            MODEL = joblib.load(model_path)
            print(f"✓ Random Forest model loaded from {model_path}")
        else:
            print(f"⚠ Model not found at {model_path}")
            return False
        
        # Load scaler
        scaler_path = 'artifacts/scaler.pkl'
        if os.path.exists(scaler_path):
            SCALER = joblib.load(scaler_path)
            print(f"✓ Scaler loaded from {scaler_path}")
        else:
            print(f"⚠ Scaler not found at {scaler_path}")
            return False
        
        # Load CNN model (optional)
        cnn_path = 'artifacts/cnn_ultrasound_model.h5'
        if os.path.exists(cnn_path):
            try:
                import tensorflow as tf
                CNN_MODEL = tf.keras.models.load_model(cnn_path)
                print(f"✓ CNN ultrasound model loaded from {cnn_path}")
            except Exception as e:
                print(f"⚠ CNN model load failed: {e}")
        
        return True
    
    except Exception as e:
        print(f"✗ Error loading artifacts: {e}")
        return False

# ============================================================================
# PREPROCESSING WITH SMART IMPUTATION
# ============================================================================

def preprocess_with_imputation(user_input: dict):
    """
    Preprocess user input with intelligent imputation.
    
    Steps:
    1. Accept partial user input (8-10 fields)
    2. Auto-calculate derived features (BMI, FSH/LH, Waist:Hip Ratio)
    3. Impute missing features with training medians
    4. Enforce feature order and scale
    
    Args:
        user_input: Dictionary with user-provided values
    
    Returns:
        X_scaled: Scaled feature array ready for prediction
        imputed_features: List of features that were imputed
    """
    input_dict = user_input.copy()
    imputed_features = []
    
    # 1. Auto-calculate BMI if height and weight provided
    if 'Weight (Kg)' in input_dict and 'Height(Cm)' in input_dict:
        weight = float(input_dict['Weight (Kg)'])
        height = float(input_dict['Height(Cm)'])
        input_dict['BMI'] = round(weight / ((height/100) ** 2), 2)
    
    # 2. Auto-calculate Waist:Hip Ratio if both provided
    if 'Waist(inch)' in input_dict and 'Hip(inch)' in input_dict:
        waist = float(input_dict['Waist(inch)'])
        hip = float(input_dict['Hip(inch)'])
        input_dict['Waist:Hip Ratio'] = round(waist / hip, 2)
    
    # 3. Auto-calculate FSH/LH ratio if both provided
    if 'FSH(mIU/mL)' in input_dict and 'LH(mIU/mL)' in input_dict:
        fsh = float(input_dict['FSH(mIU/mL)'])
        lh = float(input_dict['LH(mIU/mL)'])
        input_dict['FSH/LH'] = round(fsh / (lh + 0.01), 2)  # Avoid division by zero
    
    # 4. Impute missing features with training medians
    for col in FEATURE_COLS:
        if col not in input_dict:
            input_dict[col] = TRAINING_MEDIANS.get(col, 0)
            imputed_features.append(col)
    
    # 5. Create DataFrame with correct feature order
    df = pd.DataFrame([input_dict])
    df = df[FEATURE_COLS]  # Enforce order
    
    # 6. Scale features
    X_scaled = SCALER.transform(df)
    
    return X_scaled, imputed_features

# ============================================================================
# ULTRASOUND IMAGE PROCESSING (OPTIONAL)
# ============================================================================

def process_ultrasound_image(base64_str: str):
    """
    Process ultrasound image using CNN to detect follicle count.
    
    Args:
        base64_str: Base64 encoded image string
    
    Returns:
        follicle_count: Estimated follicle count (int) or None if failed
    """
    if CNN_MODEL is None:
        return None
    
    try:
        # Decode base64 image
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        
        img_data = base64.b64decode(base64_str)
        img = Image.open(BytesIO(img_data)).convert('L')  # Grayscale
        
        # Resize to model input size
        img = np.array(img)
        img = cv2.resize(img, (128, 128))
        img = img.astype('float32') / 255.0
        img = img.reshape(1, 128, 128, 1)
        
        # Predict
        pred = CNN_MODEL.predict(img, verbose=0)[0][0]
        follicle_count = int(pred * 30)  # Scale to realistic range
        
        return follicle_count
    
    except Exception as e:
        print(f"Error processing ultrasound: {e}")
        return None

# ============================================================================
# RISK ASSESSMENT
# ============================================================================

def get_risk_level(probability: float):
    """Determine risk level from probability."""
    if probability >= 0.7:
        return "HIGH"
    elif probability >= 0.4:
        return "MEDIUM"
    else:
        return "LOW"

def generate_recommendations(probability: float, user_input: dict):
    """Generate personalized recommendations based on risk."""
    recommendations = []
    risk_level = get_risk_level(probability)
    
    if risk_level in ["HIGH", "MEDIUM"]:
        recommendations.append({
            "category": "Medical",
            "title": "Consult Healthcare Provider",
            "description": "Schedule appointment with gynecologist/endocrinologist for proper diagnosis.",
            "priority": "high"
        })
        
        # AMH-specific recommendation
        if user_input.get('AMH(ng/mL)', 0) > 4.0:
            recommendations.append({
                "category": "Hormonal",
                "title": "Elevated AMH Detected",
                "description": "Your AMH levels suggest possible PCOS. Discuss hormone therapy options.",
                "priority": "high"
            })
        
        # Lifestyle recommendations
        if user_input.get('Weight gain(Y/N)', 0) == 1:
            recommendations.append({
                "category": "Lifestyle",
                "title": "Weight Management",
                "description": "Consider structured diet and exercise plan to manage weight.",
                "priority": "medium"
            })
        
        if user_input.get('Reg.Exercise(Y/N)', 0) == 0:
            recommendations.append({
                "category": "Lifestyle",
                "title": "Regular Exercise",
                "description": "Start with 30 minutes of moderate exercise 5 days/week.",
                "priority": "medium"
            })
    
    else:
        recommendations.append({
            "category": "Prevention",
            "title": "Maintain Healthy Lifestyle",
            "description": "Continue balanced diet, regular exercise, and annual check-ups.",
            "priority": "low"
        })
    
    return recommendations

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'FemiHealth PCOS Prediction API',
        'model_loaded': MODEL is not None,
        'scaler_loaded': SCALER is not None,
        'cnn_loaded': CNN_MODEL is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/minimal-input', methods=['GET'])
def minimal_input_info():
    """Return information about minimal required inputs."""
    return jsonify({
        'required_fields': MINIMAL_INPUT_FIELDS,
        'total_features': len(FEATURE_COLS),
        'optional_ultrasound': CNN_MODEL is not None,
        'field_descriptions': {
            'Age (yrs)': 'Your age in years',
            'Weight (Kg)': 'Your weight in kilograms',
            'Height(Cm)': 'Your height in centimeters',
            'Cycle length(days)': 'Average menstrual cycle length',
            'Weight gain(Y/N)': '1 if yes, 0 if no',
            'hair growth(Y/N)': 'Excessive hair growth: 1 if yes, 0 if no',
            'Skin darkening (Y/N)': 'Skin darkening: 1 if yes, 0 if no',
            'Pimples(Y/N)': 'Acne/pimples: 1 if yes, 0 if no',
            'Fast food (Y/N)': 'Regular fast food consumption: 1 if yes, 0 if no',
            'Reg.Exercise(Y/N)': 'Regular exercise: 1 if yes, 0 if no'
        }
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint with smart imputation.
    
    Expected JSON:
    {
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
        },
        "image_base64": "optional_ultrasound_image"
    }
    """
    try:
        # Check if model loaded
        if MODEL is None or SCALER is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded. Please check server configuration.'
            }), 503
        
        # Get request data
        data = request.get_json()
        user_input = data.get('clinical', {})
        
        # Validate minimal input
        missing_fields = [f for f in MINIMAL_INPUT_FIELDS if f not in user_input]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Preprocess with imputation
        X_scaled, imputed_features = preprocess_with_imputation(user_input)
        
        # Make prediction
        prediction_proba = MODEL.predict_proba(X_scaled)[0]
        probability = float(prediction_proba[1])  # PCOS probability
        risk_level = get_risk_level(probability)
        
        # Process ultrasound if provided
        follicle_count = None
        if 'image_base64' in data and data['image_base64']:
            follicle_count = process_ultrasound_image(data['image_base64'])
        
        # Generate recommendations
        recommendations = generate_recommendations(probability, user_input)
        
        # Build response
        response = {
            'success': True,
            'pcos_risk_probability': round(probability, 3),
            'risk_level': risk_level,
            'confidence': round(float(prediction_proba.max()), 3),
            'prediction': 'PCOS Positive' if probability >= 0.5 else 'PCOS Negative',
            'follicle_count': follicle_count,
            'input_summary': {
                'user_provided': list(user_input.keys()),
                'imputed_features': imputed_features,
                'total_features_used': len(FEATURE_COLS)
            },
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({
            'success': False,
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/features', methods=['GET'])
def get_features():
    """Return all 41 features and their medians."""
    return jsonify({
        'total_features': len(FEATURE_COLS),
        'features': FEATURE_COLS,
        'training_medians': TRAINING_MEDIANS,
        'minimal_input': MINIMAL_INPUT_FIELDS
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'available_endpoints': [
            'GET /health',
            'GET /minimal-input',
            'GET /features',
            'POST /predict'
        ]
    }), 404

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("\n" + "="*70)
    print("  FemiHealth PCOS Prediction API - 41 Feature Model")
    print("  Author: Njenga Paula Waithira (143109)")
    print("  Strathmore University - June 2025")
    print("="*70)
    
    if load_artifacts():
        print("\n✓ All artifacts loaded successfully!")
        print(f"✓ Total features: {len(FEATURE_COLS)}")
        print(f"✓ Minimal user input required: {len(MINIMAL_INPUT_FIELDS)} fields")
        print(f"✓ Auto-imputed features: {len(FEATURE_COLS) - len(MINIMAL_INPUT_FIELDS)}")
        print(f"\n✓ Starting server on http://localhost:5001")
        print("="*70 + "\n")
        
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("\n✗ Failed to load model artifacts.")
        print("✗ Please ensure artifacts/ directory contains:")
        print("   - rf_pcos_model.pkl")
        print("   - scaler.pkl")
        print("   - cnn_ultrasound_model.h5 (optional)")
        print("="*70 + "\n")
