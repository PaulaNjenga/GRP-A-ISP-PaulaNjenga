#!/usr/bin/env python3
"""
Quick test to verify artifacts are loaded correctly
Run this before starting the Flask server
"""

import os
import sys

print("="*70)
print("  Testing ML Service Artifacts")
print("="*70)

# Test 1: Check files exist
print("\n1. Checking artifact files...")
required_files = {
    'artifacts/rf_pcos_model.pkl': 'Random Forest Model',
    'artifacts/scaler.pkl': 'Feature Scaler',
    'artifacts/feature_cols.json': 'Feature Columns'
}

optional_files = {
    'artifacts/cnn_ultrasound_model.h5': 'CNN Ultrasound Model'
}

all_good = True
for filepath, name in required_files.items():
    if os.path.exists(filepath):
        size = os.path.getsize(filepath) / (1024 * 1024)  # MB
        print(f"   ✓ {name}: {filepath} ({size:.2f} MB)")
    else:
        print(f"   ✗ {name}: NOT FOUND at {filepath}")
        all_good = False

for filepath, name in optional_files.items():
    if os.path.exists(filepath):
        size = os.path.getsize(filepath) / (1024 * 1024)  # MB
        print(f"   ✓ {name}: {filepath} ({size:.2f} MB)")
    else:
        print(f"   ⚠ {name}: Not found (optional)")

if not all_good:
    print("\n✗ Missing required artifacts!")
    sys.exit(1)

# Test 2: Load artifacts
print("\n2. Loading artifacts...")
try:
    import joblib
    import pickle
    
    # Load feature columns
    with open('artifacts/feature_cols.json', 'rb') as f:
        feature_cols = pickle.load(f)
    print(f"   ✓ Feature columns loaded: {len(feature_cols)} features")
    
    # Load model
    model = joblib.load('artifacts/rf_pcos_model.pkl')
    print(f"   ✓ Random Forest model loaded")
    print(f"     - Type: {type(model).__name__}")
    print(f"     - N estimators: {model.n_estimators if hasattr(model, 'n_estimators') else 'N/A'}")
    
    # Load scaler
    scaler = joblib.load('artifacts/scaler.pkl')
    print(f"   ✓ Scaler loaded")
    print(f"     - Type: {type(scaler).__name__}")
    
except Exception as e:
    print(f"   ✗ Error loading artifacts: {e}")
    sys.exit(1)

# Test 3: Verify feature columns
print("\n3. Verifying feature columns...")
print(f"   Total features: {len(feature_cols)}")
print(f"\n   First 10 features:")
for i, feat in enumerate(feature_cols[:10], 1):
    print(f"     {i}. {feat}")
print(f"\n   Last 5 features:")
for i, feat in enumerate(feature_cols[-5:], len(feature_cols)-4):
    print(f"     {i}. {feat}")

# Test 4: Test prediction with sample data
print("\n4. Testing prediction with sample data...")
try:
    import numpy as np
    
    # Create sample input (all features with median values)
    sample_data = {
        'Age (yrs)': 28,
        'Weight (Kg)': 70,
        'Height(Cm)': 165,
        'BMI': 25.7,
        'Blood Group': 11,
        'Pulse rate(bpm)': 72,
        'RR (breaths/min)': 16,
        'Hb(g/dl)': 12.5,
        'Cycle(R/I)': 1,
        'Cycle length(days)': 35,
        'Marraige Status (Yrs)': 2,
        'Pregnant(Y/N)': 0,
        'No. of aborptions': 0,
        'I   beta-HCG(mIU/mL)': 1.5,
        'II    beta-HCG(mIU/mL)': 1.5,
        'FSH(mIU/mL)': 6.5,
        'LH(mIU/mL)': 8.5,
        'FSH/LH': 0.76,
        'Hip(inch)': 36,
        'Waist(inch)': 32,
        'Waist:Hip Ratio': 0.89,
        'TSH (mIU/L)': 2.5,
        'AMH(ng/mL)': 4.5,
        'PRL(ng/mL)': 15,
        'Vit D3 (ng/mL)': 25,
        'PRG(ng/mL)': 8,
        'RBS(mg/dl)': 95,
        'Weight gain(Y/N)': 1,
        'hair growth(Y/N)': 1,
        'Skin darkening (Y/N)': 0,
        'Hair loss(Y/N)': 0,
        'Pimples(Y/N)': 1,
        'Fast food (Y/N)': 1,
        'Reg.Exercise(Y/N)': 0,
        'BP _Systolic (mmHg)': 120,
        'BP _Diastolic (mmHg)': 80,
        'Follicle No. (L)': 10,
        'Follicle No. (R)': 12,
        'Avg. F size (L) (mm)': 5,
        'Avg. F size (R) (mm)': 5,
        'Endometrium (mm)': 8
    }
    
    # Create feature vector in correct order
    X = np.array([[sample_data[feat] for feat in feature_cols]])
    
    # Scale features
    X_scaled = scaler.transform(X)
    
    # Make prediction
    prediction = model.predict(X_scaled)[0]
    probability = model.predict_proba(X_scaled)[0]
    
    print(f"   ✓ Prediction successful!")
    print(f"     - Prediction: {'PCOS Positive' if prediction == 1 else 'PCOS Negative'}")
    print(f"     - Probability: {probability[1]:.3f}")
    
    # Determine risk level
    if probability[1] >= 0.7:
        risk_level = "HIGH"
    elif probability[1] >= 0.4:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    print(f"     - Risk Level: {risk_level}")
    
except Exception as e:
    print(f"   ✗ Prediction test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Success!
print("\n" + "="*70)
print("  ✅ All tests passed! Artifacts are working correctly.")
print("="*70)
print("\nYou can now start the Flask server:")
print("  python3 app_41_features.py")
print("\nOr run the full test suite:")
print("  python3 test_prediction.py")
print()
