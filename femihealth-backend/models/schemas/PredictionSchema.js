const mongoose = require('mongoose');

// Prediction Schema
const predictionSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  anonymousUserId: {
    type: String,
    required: true,
    index: true
  },
  
  // Doctor Reference (for doctor-created predictions)
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Prediction Type
  type: {
    type: String,
    enum: ['tabular', 'image', 'multimodal'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['self_assessment', 'medical_diagnosis'],
    default: 'self_assessment'
  },
  
  // Input Data
  inputData: {
    // Basic measurements
    age: Number,
    weight: Number,
    height: Number,
    bmi: Number,
    
    // Hormonal markers
    glucose: Number,
    insulin: Number,
    testosterone: Number,
    lhFshRatio: Number,
    
    // Symptoms (boolean flags)
    irregularPeriods: Boolean,
    weightGain: Boolean,
    acne: Boolean,
    hairGrowth: Boolean,
    hairLoss: Boolean,
    darkPatches: Boolean,
    moodChanges: Boolean,
    fatigue: Boolean,
    
    // Lifestyle factors
    exerciseFrequency: {
      type: String,
      enum: ['never', 'rarely', 'sometimes', 'often', 'daily']
    },
    dietType: {
      type: String,
      enum: ['balanced', 'high_carb', 'low_carb', 'vegetarian', 'vegan', 'other']
    },
    stressLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    sleepHours: Number,
    
    // Family history
    familyHistoryPCOS: Boolean,
    familyHistoryDiabetes: Boolean,
    familyHistoryThyroid: Boolean,
    
    // Additional medical data
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    cholesterol: {
      total: Number,
      hdl: Number,
      ldl: Number
    }
  },
  
  // Test Results (for doctor diagnoses)
  testResults: {
    testosterone: String,
    insulin: String,
    glucose: String,
    lhFshRatio: String,
    thyroidFunction: String,
    lipidProfile: String,
    other: String
  },
  
  // File Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['ultrasound', 'test_result', 'document', 'image']
    },
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ML Model Results
  risk: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    required: true
  },
  
  // Risk Factors and Analysis
  riskFactors: [{
    factor: String,
    impact: {
      type: String,
      enum: ['low', 'moderate', 'high']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  
  // Recommendations
  recommendations: [String],
  
  // Clinical Information (for doctor diagnoses)
  clinicalNotes: String,
  diagnosis: String,
  treatmentPlan: String,
  followUpDate: Date,
  
  // Image Analysis (for image/multimodal predictions)
  imageAnalysis: {
    ovarianVolume: Number,
    follicleCount: Number,
    cysts: [{
      size: Number,
      location: String
    }],
    morphology: String,
    confidence: Number
  },
  
  // Anonymized Data for Analytics
  anonymizedData: {
    ageGroup: String,
    heightRange: String,
    weightRange: String,
    riskCategory: String,
    doctorInvolved: Boolean,
    createdMonth: String,
    region: String
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed', 'archived'],
    default: 'completed'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  
  // Privacy and Sharing
  isSharedForResearch: {
    type: Boolean,
    default: false
  },
  consentGiven: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
predictionSchema.index({ userId: 1, createdAt: -1 });
predictionSchema.index({ doctorId: 1, createdAt: -1 });
predictionSchema.index({ anonymousUserId: 1 });
predictionSchema.index({ type: 1 });
predictionSchema.index({ riskLevel: 1 });
predictionSchema.index({ status: 1 });
predictionSchema.index({ createdAt: -1 });

// Virtual for risk percentage
predictionSchema.virtual('riskPercentage').get(function() {
  return Math.round(this.risk * 100);
});

// Pre-save middleware
predictionSchema.pre('save', function(next) {
  if (this.isNew) {
    this.createAnonymizedData();
  }
  next();
});

// Instance Methods
predictionSchema.methods.createAnonymizedData = function() {
  const user = this.populated('userId') || this.userId;
  
  this.anonymizedData = {
    ageGroup: this.getAgeGroupFromInput(),
    heightRange: this.getHeightRangeFromInput(),
    weightRange: this.getWeightRangeFromInput(),
    riskCategory: this.riskLevel,
    doctorInvolved: !!this.doctorId,
    createdMonth: this.createdAt ? this.createdAt.toISOString().substring(0, 7) : new Date().toISOString().substring(0, 7),
    region: 'anonymized' // Can be enhanced with actual region data
  };
};

predictionSchema.methods.getAgeGroupFromInput = function() {
  const age = this.inputData?.age;
  if (!age) return 'unknown';
  if (age < 18) return 'under-18';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
};

predictionSchema.methods.getHeightRangeFromInput = function() {
  const height = this.inputData?.height;
  if (!height) return 'unknown';
  if (height < 150) return 'under-150';
  if (height < 160) return '150-159';
  if (height < 170) return '160-169';
  if (height < 180) return '170-179';
  return '180+';
};

predictionSchema.methods.getWeightRangeFromInput = function() {
  const weight = this.inputData?.weight;
  if (!weight) return 'unknown';
  if (weight < 50) return 'under-50';
  if (weight < 60) return '50-59';
  if (weight < 70) return '60-69';
  if (weight < 80) return '70-79';
  return '80+';
};

predictionSchema.methods.toAnonymized = function() {
  return {
    anonymousId: `pred_${this._id.toString().substring(0, 12)}`,
    anonymousUserId: this.anonymousUserId,
    type: this.type,
    purpose: this.purpose,
    risk: this.risk,
    riskLevel: this.riskLevel,
    confidence: this.confidence,
    ageGroup: this.anonymizedData?.ageGroup || this.getAgeGroupFromInput(),
    heightRange: this.anonymizedData?.heightRange || this.getHeightRangeFromInput(),
    weightRange: this.anonymizedData?.weightRange || this.getWeightRangeFromInput(),
    doctorInvolved: this.anonymizedData?.doctorInvolved || !!this.doctorId,
    createdMonth: this.anonymizedData?.createdMonth || this.createdAt.toISOString().substring(0, 7),
    hasAttachments: this.attachments && this.attachments.length > 0,
    status: this.status
  };
};

predictionSchema.methods.toPatientView = function() {
  const obj = this.toObject();
  
  // Remove sensitive medical details for patient view
  delete obj.clinicalNotes;
  delete obj.reviewNotes;
  
  // Simplify attachments for patient view
  if (obj.attachments) {
    obj.attachments = obj.attachments.map(att => ({
      type: att.type,
      filename: att.originalName,
      uploadedAt: att.uploadedAt
    }));
  }
  
  return obj;
};

predictionSchema.methods.toDoctorView = function() {
  // Doctors get full access to prediction data
  return this.toObject();
};

predictionSchema.methods.getPatientInfo = async function() {
  if (!this.populated('userId')) {
    await this.populate('userId', 'firstName lastName email anonymousId ageGroup');
  }
  
  const user = this.userId;
  if (!user) return null;
  
  return {
    anonymousId: user.anonymousId,
    ageGroup: user.anonymizedData?.ageGroup || user.getAgeGroup(),
    totalPredictions: await this.constructor.countDocuments({ userId: user._id })
  };
};

// Static Methods
predictionSchema.statics.getAnonymizedStats = function() {
  return this.aggregate([
    {
      $project: {
        anonymousUserId: 1,
        type: 1,
        purpose: 1,
        risk: 1,
        riskLevel: 1,
        confidence: 1,
        ageGroup: '$anonymizedData.ageGroup',
        heightRange: '$anonymizedData.heightRange',
        weightRange: '$anonymizedData.weightRange',
        doctorInvolved: '$anonymizedData.doctorInvolved',
        createdMonth: '$anonymizedData.createdMonth',
        hasAttachments: { $gt: [{ $size: { $ifNull: ['$attachments', []] } }, 0] },
        status: 1
      }
    }
  ]);
};

predictionSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgRisk: { $avg: '$risk' },
        avgConfidence: { $avg: '$confidence' },
        riskDistribution: {
          $push: '$riskLevel'
        },
        typeDistribution: {
          $push: '$type'
        }
      }
    },
    {
      $project: {
        total: 1,
        avgRisk: { $round: ['$avgRisk', 3] },
        avgConfidence: { $round: ['$avgConfidence', 3] },
        riskDistribution: {
          low: {
            $size: {
              $filter: {
                input: '$riskDistribution',
                cond: { $eq: ['$$this', 'low'] }
              }
            }
          },
          moderate: {
            $size: {
              $filter: {
                input: '$riskDistribution',
                cond: { $eq: ['$$this', 'moderate'] }
              }
            }
          },
          high: {
            $size: {
              $filter: {
                input: '$riskDistribution',
                cond: { $eq: ['$$this', 'high'] }
              }
            }
          }
        },
        typeDistribution: {
          tabular: {
            $size: {
              $filter: {
                input: '$typeDistribution',
                cond: { $eq: ['$$this', 'tabular'] }
              }
            }
          },
          image: {
            $size: {
              $filter: {
                input: '$typeDistribution',
                cond: { $eq: ['$$this', 'image'] }
              }
            }
          },
          multimodal: {
            $size: {
              $filter: {
                input: '$typeDistribution',
                cond: { $eq: ['$$this', 'multimodal'] }
              }
            }
          }
        }
      }
    }
  ]);
};

module.exports = predictionSchema;
