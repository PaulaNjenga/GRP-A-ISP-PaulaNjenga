#!/usr/bin/env python3
"""
Quick test script for PCOS prediction API
Run this to verify your ML service is working correctly
"""

import requests
import json
from datetime import datetime

# Configuration
API_URL = "http://localhost:5001"

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)

def test_health():
    """Test health endpoint"""
    print_header("Testing Health Endpoint")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        result = response.json()
        print(f"✓ Status: {result['status']}")
        print(f"✓ Model Loaded: {result['model_loaded']}")
        print(f"✓ Scaler Loaded: {result['scaler_loaded']}")
        print(f"✓ CNN Loaded: {result['cnn_loaded']}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_minimal_input():
    """Test minimal input endpoint"""
    print_header("Testing Minimal Input Endpoint")
    try:
        response = requests.get(f"{API_URL}/minimal-input", timeout=5)
        result = response.json()
        print(f"✓ Required fields: {len(result['required_fields'])}")
        print(f"✓ Total features: {result['total_features']}")
        print(f"\nRequired Fields:")
        for field in result['required_fields']:
            print(f"  - {field}")
        return True
    except Exception as e:
        print(f"✗ Minimal input check failed: {e}")
        return False

def test_prediction(test_case):
    """Test prediction with given test case"""
    print_header(f"Testing: {test_case['name']}")
    
    payload = {
        "clinical": test_case['clinical']
    }
    
    try:
        print(f"\nSending request...")
        response = requests.post(
            f"{API_URL}/predict",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n✓ Prediction successful!")
            print(f"\n📊 Results:")
            print(f"  Risk Level: {result['risk_level']}")
            print(f"  Probability: {result['pcos_risk_probability']:.3f} ({result['pcos_risk_probability']*100:.1f}%)")
            print(f"  Prediction: {result['prediction']}")
            print(f"  Confidence: {result['confidence']:.3f}")
            
            if result.get('follicle_count'):
                print(f"  Follicle Count: {result['follicle_count']}")
            
            print(f"\n📝 Input Summary:")
            print(f"  User Provided: {len(result['input_summary']['user_provided'])} fields")
            print(f"  Auto-Imputed: {len(result['input_summary']['imputed_features'])} fields")
            print(f"  Total Used: {result['input_summary']['total_features_used']} features")
            
            if result.get('recommendations'):
                print(f"\n💡 Recommendations ({len(result['recommendations'])}):")
                for i, rec in enumerate(result['recommendations'][:3], 1):
                    print(f"  {i}. [{rec['priority'].upper()}] {rec['title']}")
                    print(f"     {rec['description'][:80]}...")
            
            return True
        else:
            print(f"✗ Prediction failed: {response.status_code}")
            print(f"  Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"✗ Prediction failed: {e}")
        return False

def main():
    """Main test function"""
    print("\n" + "="*70)
    print("  FemiHealth PCOS Prediction API - Test Suite")
    print("  Author: Njenga Paula Waithira (143109)")
    print("="*70)
    print(f"\nAPI URL: {API_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test cases
    test_cases = [
        {
            "name": "HIGH RISK - Multiple Symptoms",
            "clinical": {
                "Age (yrs)": 28,
                "Weight (Kg)": 78,
                "Height(Cm)": 162,
                "Cycle length(days)": 45,
                "Weight gain(Y/N)": 1,
                "hair growth(Y/N)": 1,
                "Skin darkening (Y/N)": 1,
                "Pimples(Y/N)": 1,
                "Fast food (Y/N)": 1,
                "Reg.Exercise(Y/N)": 0
            }
        },
        {
            "name": "MEDIUM RISK - Some Symptoms",
            "clinical": {
                "Age (yrs)": 25,
                "Weight (Kg)": 68,
                "Height(Cm)": 165,
                "Cycle length(days)": 35,
                "Weight gain(Y/N)": 1,
                "hair growth(Y/N)": 1,
                "Skin darkening (Y/N)": 0,
                "Pimples(Y/N)": 1,
                "Fast food (Y/N)": 0,
                "Reg.Exercise(Y/N)": 1
            }
        },
        {
            "name": "LOW RISK - Healthy Profile",
            "clinical": {
                "Age (yrs)": 30,
                "Weight (Kg)": 60,
                "Height(Cm)": 168,
                "Cycle length(days)": 28,
                "Weight gain(Y/N)": 0,
                "hair growth(Y/N)": 0,
                "Skin darkening (Y/N)": 0,
                "Pimples(Y/N)": 0,
                "Fast food (Y/N)": 0,
                "Reg.Exercise(Y/N)": 1
            }
        }
    ]
    
    # Run tests
    results = {
        "health": False,
        "minimal_input": False,
        "predictions": []
    }
    
    # Test health
    results["health"] = test_health()
    
    if not results["health"]:
        print("\n✗ Health check failed. Make sure the ML service is running.")
        print("  Start it with: python app_41_features.py")
        return
    
    # Test minimal input
    results["minimal_input"] = test_minimal_input()
    
    # Test predictions
    for test_case in test_cases:
        success = test_prediction(test_case)
        results["predictions"].append({
            "name": test_case["name"],
            "success": success
        })
    
    # Summary
    print_header("Test Summary")
    print(f"\n✓ Health Check: {'PASS' if results['health'] else 'FAIL'}")
    print(f"✓ Minimal Input: {'PASS' if results['minimal_input'] else 'FAIL'}")
    print(f"\nPrediction Tests:")
    for pred in results["predictions"]:
        status = "✓ PASS" if pred["success"] else "✗ FAIL"
        print(f"  {status}: {pred['name']}")
    
    total_tests = 2 + len(results["predictions"])
    passed_tests = sum([
        results["health"],
        results["minimal_input"],
        sum(1 for p in results["predictions"] if p["success"])
    ])
    
    print(f"\n{'='*70}")
    print(f"  Total: {passed_tests}/{total_tests} tests passed")
    print(f"{'='*70}\n")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Your ML service is working perfectly!")
    else:
        print("⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()
