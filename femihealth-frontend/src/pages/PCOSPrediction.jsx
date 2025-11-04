import React, { useState } from 'react'
import { Activity, AlertCircle, CheckCircle, TrendingUp, Upload, X } from 'lucide-react'
import { predictionAPI } from '../services/api'

const PCOSPrediction = () => {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    cycleLength: '',
    weightGain: false,
    hairGrowth: false,
    skinDarkening: false,
    pimples: false,
    fastFood: false,
    exercise: false
  })

  const [ultrasoundImage, setUltrasoundImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUltrasoundImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setUltrasoundImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Prepare clinical data
      const clinicalData = {
        'Age (yrs)': parseFloat(formData.age),
        'Weight (Kg)': parseFloat(formData.weight),
        'Height(Cm)': parseFloat(formData.height),
        'Cycle length(days)': parseFloat(formData.cycleLength),
        'Weight gain(Y/N)': formData.weightGain ? 1 : 0,
        'hair growth(Y/N)': formData.hairGrowth ? 1 : 0,
        'Skin darkening (Y/N)': formData.skinDarkening ? 1 : 0,
        'Pimples(Y/N)': formData.pimples ? 1 : 0,
        'Fast food (Y/N)': formData.fastFood ? 1 : 0,
        'Reg.Exercise(Y/N)': formData.exercise ? 1 : 0
      }

      // Prepare request payload
      const payload = {
        clinical: clinicalData
      }

      // Add ultrasound image if provided
      if (imagePreview) {
        payload.image_base64 = imagePreview
      }

      // Make prediction request
      const response = await predictionAPI.predictPCOS(payload)
      console.log('Prediction response:', response)
      console.log('Prediction data:', response.data)
      
      // Handle nested data structure
      const resultData = response.data?.data || response.data
      console.log('Result data:', resultData)
      setResult(resultData)
    } catch (err) {
      console.error('Prediction error:', err)
      console.error('Error response:', err.response)
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to get prediction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Activity className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            PCOS Risk Assessment
          </h1>
          <p className="mt-2 text-gray-600">
            Get your personalized PCOS risk prediction in minutes
          </p>
        </div>

        {/* Main Form Card */}
        <div className="card mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age (years) *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                    min="15"
                    max="50"
                    className="input-field"
                    placeholder="e.g., 28"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    required
                    min="30"
                    max="200"
                    step="0.1"
                    className="input-field"
                    placeholder="e.g., 65"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    required
                    min="120"
                    max="220"
                    step="0.1"
                    className="input-field"
                    placeholder="e.g., 165"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cycle Length (days) *
                  </label>
                  <input
                    type="number"
                    name="cycleLength"
                    value={formData.cycleLength}
                    onChange={handleInputChange}
                    required
                    min="20"
                    max="60"
                    className="input-field"
                    placeholder="e.g., 28"
                  />
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Symptoms & Lifestyle
              </h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                  <input
                    type="checkbox"
                    name="weightGain"
                    checked={formData.weightGain}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Unexplained weight gain
                  </span>
                </label>

                <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                  <input
                    type="checkbox"
                    name="hairGrowth"
                    checked={formData.hairGrowth}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Excessive hair growth (face, chest, back)
                  </span>
                </label>

                <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                  <input
                    type="checkbox"
                    name="skinDarkening"
                    checked={formData.skinDarkening}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Skin darkening (neck, armpits, groin)
                  </span>
                </label>

                <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                  <input
                    type="checkbox"
                    name="pimples"
                    checked={formData.pimples}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Acne or pimples
                  </span>
                </label>

                <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                  <input
                    type="checkbox"
                    name="fastFood"
                    checked={formData.fastFood}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Regular fast food consumption
                  </span>
                </label>

                <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition">
                  <input
                    type="checkbox"
                    name="exercise"
                    checked={formData.exercise}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Regular exercise (3+ times/week)
                  </span>
                </label>
              </div>
            </div>

            {/* Ultrasound Upload (Optional) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ultrasound Image (Optional)
              </h2>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Upload ovarian ultrasound image for enhanced prediction
                  </p>
                  <label className="mt-4 inline-block">
                    <span className="btn-secondary cursor-pointer">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Ultrasound preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Get PCOS Risk Assessment'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Risk Score Card */}
            <div className={`card border-2 ${getRiskColor(result.risk_level)}`}>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="h-16 w-16" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {result.pcos_risk_probability !== undefined && result.pcos_risk_probability !== null 
                    ? (result.pcos_risk_probability * 100).toFixed(1) 
                    : 'N/A'}%
                </div>
                <div className="text-xl font-semibold mb-4">
                  {result.risk_level || 'UNKNOWN'} RISK
                </div>
                <p className="text-sm">
                  {result.prediction || 'No prediction available'}
                </p>
                {result.follicle_count && (
                  <p className="text-sm mt-2">
                    Detected Follicle Count: <strong>{result.follicle_count}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{rec.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Category: {rec.category}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Summary */}
            {result.input_summary && (
              <div className="card bg-blue-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Analysis Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">User Provided</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {result.input_summary.user_provided.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Auto-Imputed</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {result.input_summary.imputed_features.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Features</p>
                    <p className="text-2xl font-bold text-green-600">
                      {result.input_summary.total_features_used}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="card bg-yellow-50 border border-yellow-200">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important Disclaimer</p>
                  <p>
                    This prediction is based on machine learning analysis and should not replace professional medical diagnosis. 
                    Please consult with a qualified healthcare provider for proper evaluation and treatment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PCOSPrediction
