"""
Flask ML Service for PCOS Risk Prediction

This service provides REST API endpoints for PCOS risk prediction using trained ML models.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables for model and scaler
model = None
scaler = None
metadata = None

def load_model_artifacts():
    """Load the trained model, scaler, and metadata."""
    global model, scaler, metadata
    
    try:
        model_path = 'models/pcos_model_latest.joblib'
        scaler_path = 'models/scaler_latest.joblib'
        metadata_path = 'models/metadata_latest.json'
        
        if not os.path.exists(model_path):
            print("⚠ Model not found. Please train the model first using train_model.py")
            return False
        
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        print(f"✓ Model loaded: {metadata['model_name']}")
        print(f"✓ Training date: {metadata['training_date']}")
        print(f"✓ Model metrics:")
        for metric, value in metadata['metrics'].items():
            print(f"  - {metric}: {value:.4f}")
        
        return True
    except Exception as e:
        print(f"✗ Error loading model: {str(e)}")
        return False

def engineer_features(data):
    """Engineer features from input data."""
    beta_hcg_i = data['beta_hcg_i']
    beta_hcg_ii = data['beta_hcg_ii']
    amh = data['amh']
    
    # Calculate engineered features
    hcg_ratio = beta_hcg_ii / (beta_hcg_i + 1)  # Avoid division by zero
    hcg_difference = beta_hcg_ii - beta_hcg_i
    hcg_sum = beta_hcg_i + beta_hcg_ii
    
    return [beta_hcg_i, beta_hcg_ii, amh, hcg_ratio, hcg_difference, hcg_sum]

def get_risk_level(probability):
    """Determine risk level based on probability."""
    if probability >= 0.7:
        return 'high'
    elif probability >= 0.4:
        return 'medium'
    else:
        return 'low'

def get_prediction_label(probability):
    """Get prediction label based on probability."""
    if probability >= 0.7:
        return 'positive'
    elif probability >= 0.4:
        return 'uncertain'
    else:
        return 'negative'

def generate_recommendations(prediction, risk_level, input_data):
    """Generate personalized recommendations based on prediction."""
    recommendations = []
    
    if risk_level == 'high' or risk_level == 'medium':
        recommendations.append({
            'category': 'Medical',
            'title': 'Consult a Healthcare Provider',
            'description': 'Schedule an appointment with a gynecologist or endocrinologist for proper diagnosis and treatment.',
            'priority': 'high'
        })
        
        if input_data['amh'] > 4.0:
            recommendations.append({
                'category': 'Hormonal',
                'title': 'Elevated AMH Levels Detected',
                'description': 'Your AMH levels are elevated, which may indicate PCOS. Discuss hormone therapy options with your doctor.',
                'priority': 'high'
            })
        
        hcg_ratio = input_data['beta_hcg_ii'] / (input_data['beta_hcg_i'] + 1)
        if hcg_ratio < 1.5 or hcg_ratio > 3.0:
            recommendations.append({
                'category': 'Hormonal',
                'title': 'Abnormal β-hCG Progression',
                'description': 'Your β-hCG progression pattern is atypical. Further hormonal evaluation is recommended.',
                'priority': 'medium'
            })
        
        recommendations.append({
            'category': 'Lifestyle',
            'title': 'Maintain Healthy Weight',
            'description': 'Regular exercise and balanced diet can help manage PCOS symptoms and improve hormonal balance.',
            'priority': 'medium'
        })
        
        recommendations.append({
            'category': 'Monitoring',
            'title': 'Regular Follow-ups',
            'description': 'Schedule regular check-ups to monitor your hormonal levels and PCOS symptoms.',
            'priority': 'medium'
        })
    else:
        recommendations.append({
            'category': 'Prevention',
            'title': 'Maintain Healthy Lifestyle',
            'description': 'Continue with regular exercise, balanced diet, and routine health check-ups.',
            'priority': 'low'
        })
        
        recommendations.append({
            'category': 'Monitoring',
            'title': 'Annual Screening',
            'description': 'Consider annual hormonal screening to catch any changes early.',
            'priority': 'low'
        })
    
    return recommendations

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'PCOS ML Prediction Service',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get information about the loaded model."""
    if model is None or metadata is None:
        return jsonify({
            'error': 'Model not loaded',
            'message': 'Please train the model first using train_model.py'
        }), 503
    
    return jsonify({
        'model_name': metadata['model_name'],
        'training_date': metadata['training_date'],
        'features': metadata['features'],
        'metrics': metadata['metrics'],
        'feature_ranges': metadata['feature_ranges']
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict PCOS risk based on input features.
    
    Expected JSON input:
    {
        "beta_hcg_i": float,
        "beta_hcg_ii": float,
        "amh": float
    }
    """
    try:
        # Check if model is loaded
        if model is None or scaler is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded',
                'message': 'Please train the model first using train_model.py'
            }), 503
        
        # Get input data
        data = request.get_json()
        
        # Validate input
        required_fields = ['beta_hcg_i', 'beta_hcg_ii', 'amh']
        validation_ranges = {
            'beta_hcg_i': (0.1, 10000.0, 'mIU/mL'),
            'beta_hcg_ii': (0.1, 10000.0, 'mIU/mL'),
            'amh': (0.1, 20.0, 'ng/mL')
        }
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
            
            # Validate numeric values
            try:
                data[field] = float(data[field])
                
                # Round to 2 decimal places
                data[field] = round(data[field], 2)
                
                # Range validation
                min_val, max_val, unit = validation_ranges[field]
                if data[field] < min_val or data[field] > max_val:
                    return jsonify({
                        'success': False,
                        'error': f'Invalid value for {field}: must be between {min_val} and {max_val} {unit}'
                    }), 400
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': f'Invalid value for {field}: must be a number'
                }), 400
        
        # Engineer features
        features = engineer_features(data)
        features_array = np.array([features])
        
        # Scale features
        features_scaled = scaler.transform(features_array)
        
        # Make prediction
        prediction_proba = model.predict_proba(features_scaled)[0]
        probability = float(prediction_proba[1])  # Probability of PCOS
        
        # Get risk level and prediction label
        risk_level = get_risk_level(probability)
        prediction_label = get_prediction_label(probability)
        
        # Generate recommendations
        recommendations = generate_recommendations(prediction_label, risk_level, data)
        
        # Prepare response
        response = {
            'success': True,
            'prediction': prediction_label,
            'confidence': float(prediction_proba.max()),
            'probability': probability,
            'risk_score': probability,
            'risk_level': risk_level,
            'risk_color': 'green' if risk_level == 'low' else 'yellow' if risk_level == 'medium' else 'red',
            'details': {
                'message': f'Based on the provided hormonal markers, the PCOS risk is {risk_level}',
                'factors': ['β-hCG I levels', 'β-hCG II levels', 'AMH (Anti-Müllerian Hormone)'],
                'values': {
                    'beta_hcg_i': data['beta_hcg_i'],
                    'beta_hcg_ii': data['beta_hcg_ii'],
                    'amh': data['amh'],
                    'hcg_ratio': features[3],
                    'hcg_difference': features[4],
                    'hcg_sum': features[5]
                }
            },
            'recommendations': recommendations,
            'model_info': {
                'model_name': metadata['model_name'],
                'accuracy': metadata['metrics']['accuracy']
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Predict PCOS risk for multiple samples.
    
    Expected JSON input:
    {
        "samples": [
            {"beta_hcg_i": float, "beta_hcg_ii": float, "amh": float},
            ...
        ]
    }
    """
    try:
        if model is None or scaler is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 503
        
        data = request.get_json()
        samples = data.get('samples', [])
        
        if not samples:
            return jsonify({
                'success': False,
                'error': 'No samples provided'
            }), 400
        
        results = []
        for sample in samples:
            # Engineer features
            features = engineer_features(sample)
            features_array = np.array([features])
            features_scaled = scaler.transform(features_array)
            
            # Predict
            prediction_proba = model.predict_proba(features_scaled)[0]
            probability = float(prediction_proba[1])
            risk_level = get_risk_level(probability)
            
            results.append({
                'input': sample,
                'probability': probability,
                'risk_level': risk_level,
                'prediction': get_prediction_label(probability)
            })
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'available_endpoints': [
            'GET /health',
            'GET /model/info',
            'POST /predict',
            'POST /predict/batch'
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': str(error)
    }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("PCOS ML PREDICTION SERVICE")
    print("="*60)
    
    # Load model
    if load_model_artifacts():
        print("\n✓ Service ready!")
        print(f"✓ Starting Flask server on http://localhost:5001")
        print("="*60 + "\n")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("\n✗ Failed to load model. Please run train_model.py first.")
        print("="*60 + "\n")
