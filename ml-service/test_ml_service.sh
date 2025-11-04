#!/bin/bash

echo "=========================================="
echo "Testing ML Service"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
curl -s http://localhost:5001/health | python3 -m json.tool
echo ""
echo ""

# Test 2: Minimal Input Check
echo "2. Testing Minimal Input Endpoint..."
curl -s http://localhost:5001/minimal-input | python3 -m json.tool
echo ""
echo ""

# Test 3: Simple Prediction
echo "3. Testing Prediction with Sample Data..."
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
  }' | python3 -m json.tool

echo ""
echo ""
echo "=========================================="
echo "Test Complete!"
echo "=========================================="
