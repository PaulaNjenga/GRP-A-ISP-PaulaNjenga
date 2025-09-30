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
    // Tabular data fields
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
