import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['tabular', 'image', 'multimodal'],
    required: true,
  },
  inputData: {
    // Primary PCOS indicators (optional - for old 3-feature model)
    beta_hcg_i: {
      type: Number,
      min: [0.1, 'β-hCG I must be at least 0.1 mIU/mL'],
      max: [10000.0, 'β-hCG I must not exceed 10000.0 mIU/mL']
    },
    beta_hcg_ii: {
      type: Number,
      min: [0.1, 'β-hCG II must be at least 0.1 mIU/mL'],
      max: [10000.0, 'β-hCG II must not exceed 10000.0 mIU/mL']
    },
    amh: {
      type: Number,
      min: [0.1, 'AMH must be at least 0.1 ng/mL'],
      max: [20.0, 'AMH must not exceed 20.0 ng/mL']
    },
    
    // Optional additional fields
    age: Number,
    weight: Number,
    height: Number,
    bmi: Number,
    bloodGroup: String,
    pulseRate: Number,
    rrBreathsPerMin: Number,
    hbGdl: Number,
    cycle: String,
    cycleLength: Number,
    marriageStatus: String,
    pregnant: Boolean,
    abortions: Number,
    hipInches: Number,
    waistInches: Number,
    waistHipRatio: Number,
    weightGain: Boolean,
    hairGrowth: Boolean,
    skinDarkening: Boolean,
    hairLoss: Boolean,
    pimples: Boolean,
    fastFood: Boolean,
    exercise: Boolean,
    bpSystolic: Number,
    bpDiastolic: Number,
    follicleNoL: Number,
    follicleNoR: Number,
    avgFSizeL: Number,
    avgFSizeR: Number,
    endometrium: Number,
    
    // Image data
    imageUrl: String,
    imagePath: String,
    
    // Additional metadata
    notes: String,
  },
  result: {
    prediction: {
      type: String,
      enum: ['positive', 'negative', 'uncertain'],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    probability: Number,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    details: mongoose.Schema.Types.Mixed,
  },
  recommendations: [{
    category: String,
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  error: String,
  processedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewNotes: String,
  reviewedAt: Date,
}, {
  timestamps: true,
});

// Index for faster queries
predictionSchema.index({ user: 1, createdAt: -1 });
predictionSchema.index({ status: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);

export default Prediction;
