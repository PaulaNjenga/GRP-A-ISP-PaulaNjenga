// PCOS Risk Assessment ML Model Simulation
// In production, this would integrate with actual ML models (TensorFlow.js, Python API, etc.)

class PCOSRiskModel {
  constructor() {
    // Feature weights for PCOS risk calculation
    this.weights = {
      age: 0.05,
      bmi: 0.25,
      glucose: 0.20,
      insulin: 0.18,
      blood_pressure: 0.10,
      family_history: 0.15,
      irregular_periods: 0.20,
      weight_gain: 0.12,
      hair_growth: 0.10,
      acne: 0.08,
      mood_swings: 0.07
    };
    
    // Risk thresholds
    this.thresholds = {
      low: 0.3,
      moderate: 0.7
    };
  }

  // Calculate BMI if not provided
  calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  // Normalize values to 0-1 scale
  normalize(value, min, max) {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  // Calculate risk score from tabular data
  calculateTabularRisk(data) {
    let riskScore = 0;
    let confidence = 0.8; // Base confidence

    // Calculate BMI if not provided
    const bmi = data.bmi || this.calculateBMI(data.weight, data.height);
    
    // Age factor (higher risk for certain age ranges)
    const ageNormalized = this.normalize(data.age, 12, 50);
    const ageFactor = data.age >= 20 && data.age <= 35 ? ageNormalized * 1.2 : ageNormalized;
    riskScore += ageFactor * this.weights.age;

    // BMI factor (higher risk for BMI > 25)
    const bmiFactor = bmi > 25 ? this.normalize(bmi, 18.5, 40) * 1.5 : this.normalize(bmi, 18.5, 40);
    riskScore += bmiFactor * this.weights.bmi;

    // Glucose factor
    if (data.glucose) {
      const glucoseFactor = data.glucose > 100 ? this.normalize(data.glucose, 70, 200) * 1.3 : this.normalize(data.glucose, 70, 200);
      riskScore += glucoseFactor * this.weights.glucose;
      confidence += 0.05;
    }

    // Insulin factor
    if (data.insulin) {
      const insulinFactor = data.insulin > 10 ? this.normalize(data.insulin, 2, 50) * 1.4 : this.normalize(data.insulin, 2, 50);
      riskScore += insulinFactor * this.weights.insulin;
      confidence += 0.05;
    }

    // Blood pressure factor
    if (data.blood_pressure) {
      const bpFactor = data.blood_pressure > 120 ? this.normalize(data.blood_pressure, 90, 180) * 1.2 : this.normalize(data.blood_pressure, 90, 180);
      riskScore += bpFactor * this.weights.blood_pressure;
      confidence += 0.03;
    }

    // Boolean factors
    if (data.family_history) {
      riskScore += this.weights.family_history;
      confidence += 0.08;
    }

    if (data.irregular_periods) {
      riskScore += this.weights.irregular_periods;
      confidence += 0.1;
    }

    if (data.weight_gain) {
      riskScore += this.weights.weight_gain;
      confidence += 0.06;
    }

    if (data.hair_growth) {
      riskScore += this.weights.hair_growth;
      confidence += 0.05;
    }

    if (data.acne) {
      riskScore += this.weights.acne;
      confidence += 0.04;
    }

    if (data.mood_swings) {
      riskScore += this.weights.mood_swings;
      confidence += 0.03;
    }

    // Normalize risk score to 0-1
    riskScore = Math.max(0, Math.min(1, riskScore));
    confidence = Math.max(0.5, Math.min(1, confidence));

    return { risk: riskScore, confidence };
  }

  // Simulate image analysis (ultrasound)
  analyzeImage(imageBuffer) {
    // In production, this would use actual image processing/ML
    const imageFeatures = {
      ovarian_volume: Math.random() * 20 + 5, // 5-25 ml
      follicle_count: Math.floor(Math.random() * 20) + 5, // 5-25 follicles
      cyst_presence: Math.random() > 0.7,
      ovarian_morphology: Math.random() > 0.6 ? 'polycystic' : 'normal'
    };

    let imageRisk = 0;
    let confidence = 0.75;

    // Ovarian volume factor
    if (imageFeatures.ovarian_volume > 10) {
      imageRisk += 0.3;
    }

    // Follicle count factor
    if (imageFeatures.follicle_count >= 12) {
      imageRisk += 0.4;
      confidence += 0.1;
    }

    // Cyst presence
    if (imageFeatures.cyst_presence) {
      imageRisk += 0.2;
      confidence += 0.05;
    }

    // Morphology
    if (imageFeatures.ovarian_morphology === 'polycystic') {
      imageRisk += 0.3;
      confidence += 0.1;
    }

    imageRisk = Math.max(0, Math.min(1, imageRisk));
    confidence = Math.max(0.6, Math.min(1, confidence));

    return {
      risk: imageRisk,
      confidence,
      analysis: this.generateImageAnalysis(imageFeatures)
    };
  }

  // Generate human-readable image analysis
  generateImageAnalysis(features) {
    let analysis = [];

    if (features.ovarian_volume > 10) {
      analysis.push(`Ovarian volume: ${features.ovarian_volume.toFixed(1)} ml (elevated)`);
    } else {
      analysis.push(`Ovarian volume: ${features.ovarian_volume.toFixed(1)} ml (normal)`);
    }

    if (features.follicle_count >= 12) {
      analysis.push(`Follicle count: ${features.follicle_count} (consistent with PCOS criteria)`);
    } else {
      analysis.push(`Follicle count: ${features.follicle_count} (within normal range)`);
    }

    if (features.cyst_presence) {
      analysis.push('Multiple small cysts observed');
    }

    analysis.push(`Ovarian morphology: ${features.ovarian_morphology}`);

    return analysis.join('. ');
  }

  // Combine tabular and image data for multimodal prediction
  predictMultimodal(tabularData, imageBuffer) {
    const tabularResult = this.calculateTabularRisk(tabularData);
    const imageResult = this.analyzeImage(imageBuffer);

    // Weighted combination (70% tabular, 30% image)
    const combinedRisk = (tabularResult.risk * 0.7) + (imageResult.risk * 0.3);
    const combinedConfidence = (tabularResult.confidence * 0.7) + (imageResult.confidence * 0.3);

    return {
      risk: combinedRisk,
      confidence: combinedConfidence,
      tabularRisk: tabularResult.risk,
      imageRisk: imageResult.risk,
      imageAnalysis: imageResult.analysis
    };
  }

  // Generate risk factors based on input data
  identifyRiskFactors(data, riskScore) {
    const factors = [];
    
    const bmi = data.bmi || this.calculateBMI(data.weight, data.height);
    
    if (bmi > 25) factors.push('Elevated BMI');
    if (data.glucose && data.glucose > 100) factors.push('Elevated glucose levels');
    if (data.insulin && data.insulin > 10) factors.push('Insulin resistance');
    if (data.blood_pressure && data.blood_pressure > 120) factors.push('High blood pressure');
    if (data.family_history) factors.push('Family history of PCOS');
    if (data.irregular_periods) factors.push('Irregular menstrual cycles');
    if (data.weight_gain) factors.push('Recent weight gain');
    if (data.hair_growth) factors.push('Excessive hair growth');
    if (data.acne) factors.push('Persistent acne');
    if (data.age >= 20 && data.age <= 35) factors.push('Age group (20-35)');

    return factors.slice(0, 5); // Return top 5 factors
  }

  // Generate personalized recommendations
  generateRecommendations(data, riskScore) {
    const recommendations = [];
    const bmi = data.bmi || this.calculateBMI(data.weight, data.height);

    if (riskScore > this.thresholds.moderate) {
      recommendations.push('Consult with a gynecologist or endocrinologist');
      recommendations.push('Consider comprehensive hormonal testing');
    }

    if (bmi > 25) {
      recommendations.push('Focus on gradual weight loss through diet and exercise');
      recommendations.push('Consider consulting with a nutritionist');
    }

    if (data.glucose && data.glucose > 100) {
      recommendations.push('Monitor blood sugar levels regularly');
      recommendations.push('Consider a low-glycemic index diet');
    }

    if (data.irregular_periods) {
      recommendations.push('Track menstrual cycles and symptoms');
    }

    // General recommendations
    recommendations.push('Maintain regular physical activity (150 minutes/week)');
    recommendations.push('Follow a balanced, anti-inflammatory diet');
    recommendations.push('Manage stress through relaxation techniques');
    recommendations.push('Ensure adequate sleep (7-9 hours nightly)');

    return recommendations.slice(0, 6); // Return top 6 recommendations
  }

  // Get risk level description
  getRiskLevel(riskScore) {
    if (riskScore < this.thresholds.low) {
      return {
        level: 'Low',
        description: 'Low risk of PCOS based on current data',
        color: 'success'
      };
    } else if (riskScore < this.thresholds.moderate) {
      return {
        level: 'Moderate',
        description: 'Moderate risk - monitoring and lifestyle changes recommended',
        color: 'warning'
      };
    } else {
      return {
        level: 'High',
        description: 'High risk - medical consultation strongly recommended',
        color: 'danger'
      };
    }
  }
}

module.exports = new PCOSRiskModel();
