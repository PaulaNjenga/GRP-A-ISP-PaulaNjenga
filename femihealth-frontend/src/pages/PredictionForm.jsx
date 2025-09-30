import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { predictionAPI } from '../services/api'
import { Heart, AlertCircle, Info, ArrowRight, ArrowLeft } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ImageUpload from '../components/forms/ImageUpload'

const PredictionForm = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    getValues
  } = useForm({
    mode: 'onChange'
  })

  const totalSteps = 4

  const handleNext = async () => {
    const isValid = await trigger()
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    try {
      let result

      if (uploadedImage) {
        // Multimodal prediction (tabular + image)
        const formData = new FormData()
        
        // Add tabular data
        Object.keys(data).forEach(key => {
          formData.append(key, data[key])
        })
        
        // Add image
        formData.append('ultrasound_image', uploadedImage.file)
        
        result = await predictionAPI.predictMultimodal(formData)
      } else {
        // Tabular-only prediction
        result = await predictionAPI.predictTabular(data)
      }

      // Navigate to results page
      navigate(`/results/${result.data.predictionId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                Basic Information
              </h2>
              <p className="text-gray-600">
                Let's start with some basic demographic and health information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  {...register('age', {
                    required: 'Age is required',
                    min: { value: 13, message: 'Age must be at least 13' },
                    max: { value: 65, message: 'Age must be less than 65' }
                  })}
                  type="number"
                  className={`input-field ${errors.age ? 'border-danger-300' : ''}`}
                  placeholder="Enter your age"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-danger-600">{errors.age.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) *
                </label>
                <input
                  {...register('weight', {
                    required: 'Weight is required',
                    min: { value: 30, message: 'Weight must be at least 30kg' },
                    max: { value: 200, message: 'Weight must be less than 200kg' }
                  })}
                  type="number"
                  step="0.1"
                  className={`input-field ${errors.weight ? 'border-danger-300' : ''}`}
                  placeholder="Enter your weight"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-danger-600">{errors.weight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm) *
                </label>
                <input
                  {...register('height', {
                    required: 'Height is required',
                    min: { value: 120, message: 'Height must be at least 120cm' },
                    max: { value: 220, message: 'Height must be less than 220cm' }
                  })}
                  type="number"
                  className={`input-field ${errors.height ? 'border-danger-300' : ''}`}
                  placeholder="Enter your height"
                />
                {errors.height && (
                  <p className="mt-1 text-sm text-danger-600">{errors.height.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BMI (calculated automatically)
                </label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={
                    watch('weight') && watch('height')
                      ? (watch('weight') / Math.pow(watch('height') / 100, 2)).toFixed(1)
                      : ''
                  }
                  readOnly
                  placeholder="BMI will be calculated"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                Menstrual Health
              </h2>
              <p className="text-gray-600">
                Information about your menstrual cycle and related symptoms
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menstrual Cycle Length (days) *
                </label>
                <input
                  {...register('cycle_length', {
                    required: 'Cycle length is required',
                    min: { value: 21, message: 'Cycle length must be at least 21 days' },
                    max: { value: 45, message: 'Cycle length must be less than 45 days' }
                  })}
                  type="number"
                  className={`input-field ${errors.cycle_length ? 'border-danger-300' : ''}`}
                  placeholder="e.g., 28"
                />
                {errors.cycle_length && (
                  <p className="mt-1 text-sm text-danger-600">{errors.cycle_length.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Average number of days between periods
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle Irregularity *
                </label>
                <select
                  {...register('cycle_irregularity', {
                    required: 'Please select cycle regularity'
                  })}
                  className={`input-field ${errors.cycle_irregularity ? 'border-danger-300' : ''}`}
                >
                  <option value="">Select option</option>
                  <option value="0">Regular (consistent cycle length)</option>
                  <option value="1">Irregular (varying cycle length)</option>
                </select>
                {errors.cycle_irregularity && (
                  <p className="mt-1 text-sm text-danger-600">{errors.cycle_irregularity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight Gain *
                </label>
                <select
                  {...register('weight_gain', {
                    required: 'Please select weight gain status'
                  })}
                  className={`input-field ${errors.weight_gain ? 'border-danger-300' : ''}`}
                >
                  <option value="">Select option</option>
                  <option value="0">No unexplained weight gain</option>
                  <option value="1">Unexplained weight gain</option>
                </select>
                {errors.weight_gain && (
                  <p className="mt-1 text-sm text-danger-600">{errors.weight_gain.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hair Growth (Hirsutism) *
                </label>
                <select
                  {...register('hair_growth', {
                    required: 'Please select hair growth status'
                  })}
                  className={`input-field ${errors.hair_growth ? 'border-danger-300' : ''}`}
                >
                  <option value="">Select option</option>
                  <option value="0">Normal hair growth</option>
                  <option value="1">Excessive hair growth (face, chest, back)</option>
                </select>
                {errors.hair_growth && (
                  <p className="mt-1 text-sm text-danger-600">{errors.hair_growth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skin Darkening *
                </label>
                <select
                  {...register('skin_darkening', {
                    required: 'Please select skin darkening status'
                  })}
                  className={`input-field ${errors.skin_darkening ? 'border-danger-300' : ''}`}
                >
                  <option value="">Select option</option>
                  <option value="0">No skin darkening</option>
                  <option value="1">Dark patches (neck, armpits, groin)</option>
                </select>
                {errors.skin_darkening && (
                  <p className="mt-1 text-sm text-danger-600">{errors.skin_darkening.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hair Loss *
                </label>
                <select
                  {...register('hair_loss', {
                    required: 'Please select hair loss status'
                  })}
                  className={`input-field ${errors.hair_loss ? 'border-danger-300' : ''}`}
                >
                  <option value="">Select option</option>
                  <option value="0">No hair loss</option>
                  <option value="1">Hair thinning or male-pattern baldness</option>
                </select>
                {errors.hair_loss && (
                  <p className="mt-1 text-sm text-danger-600">{errors.hair_loss.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pimples/Acne *
                </label>
                <select
                  {...register('pimples', {
                    required: 'Please select acne status'
                  })}
                  className={`input-field ${errors.pimples ? 'border-danger-300' : ''}`}
                >
                  <option value="">Select option</option>
                  <option value="0">No acne issues</option>
                  <option value="1">Persistent acne or skin problems</option>
                </select>
                {errors.pimples && (
                  <p className="mt-1 text-sm text-danger-600">{errors.pimples.message}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                Hormonal Levels
              </h2>
              <p className="text-gray-600">
                Hormone test results (if available from recent lab work)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Optional but recommended</p>
                  <p>
                    If you don't have recent hormone test results, you can skip these fields. 
                    However, providing this information will improve prediction accuracy.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LH (Luteinizing Hormone) mIU/mL
                </label>
                <input
                  {...register('lh_level', {
                    min: { value: 0, message: 'LH level must be positive' },
                    max: { value: 100, message: 'Please enter a valid LH level' }
                  })}
                  type="number"
                  step="0.1"
                  className={`input-field ${errors.lh_level ? 'border-danger-300' : ''}`}
                  placeholder="e.g., 8.5"
                />
                {errors.lh_level && (
                  <p className="mt-1 text-sm text-danger-600">{errors.lh_level.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FSH (Follicle Stimulating Hormone) mIU/mL
                </label>
                <input
                  {...register('fsh_level', {
                    min: { value: 0, message: 'FSH level must be positive' },
                    max: { value: 50, message: 'Please enter a valid FSH level' }
                  })}
                  type="number"
                  step="0.1"
                  className={`input-field ${errors.fsh_level ? 'border-danger-300' : ''}`}
                  placeholder="e.g., 6.2"
                />
                {errors.fsh_level && (
                  <p className="mt-1 text-sm text-danger-600">{errors.fsh_level.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LH/FSH Ratio (calculated automatically)
                </label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={
                    watch('lh_level') && watch('fsh_level') && watch('fsh_level') > 0
                      ? (watch('lh_level') / watch('fsh_level')).toFixed(2)
                      : ''
                  }
                  readOnly
                  placeholder="Ratio will be calculated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TSH (Thyroid Stimulating Hormone) μIU/mL
                </label>
                <input
                  {...register('tsh_level', {
                    min: { value: 0, message: 'TSH level must be positive' },
                    max: { value: 20, message: 'Please enter a valid TSH level' }
                  })}
                  type="number"
                  step="0.01"
                  className={`input-field ${errors.tsh_level ? 'border-danger-300' : ''}`}
                  placeholder="e.g., 2.5"
                />
                {errors.tsh_level && (
                  <p className="mt-1 text-sm text-danger-600">{errors.tsh_level.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AMH (Anti-Müllerian Hormone) ng/mL
                </label>
                <input
                  {...register('amh_level', {
                    min: { value: 0, message: 'AMH level must be positive' },
                    max: { value: 20, message: 'Please enter a valid AMH level' }
                  })}
                  type="number"
                  step="0.1"
                  className={`input-field ${errors.amh_level ? 'border-danger-300' : ''}`}
                  placeholder="e.g., 4.2"
                />
                {errors.amh_level && (
                  <p className="mt-1 text-sm text-danger-600">{errors.amh_level.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prolactin ng/mL
                </label>
                <input
                  {...register('prolactin_level', {
                    min: { value: 0, message: 'Prolactin level must be positive' },
                    max: { value: 100, message: 'Please enter a valid prolactin level' }
                  })}
                  type="number"
                  step="0.1"
                  className={`input-field ${errors.prolactin_level ? 'border-danger-300' : ''}`}
                  placeholder="e.g., 15.3"
                />
                {errors.prolactin_level && (
                  <p className="mt-1 text-sm text-danger-600">{errors.prolactin_level.message}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                Ultrasound Image (Optional)
              </h2>
              <p className="text-gray-600">
                Upload an ultrasound image for enhanced prediction accuracy
              </p>
            </div>

            <ImageUpload
              onImageSelect={setUploadedImage}
              maxSize={10}
              acceptedTypes={['image/jpeg', 'image/png', 'image/jpg']}
            />

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Image Analysis</p>
                  <p>
                    If you upload an ultrasound image, our AI will analyze it using advanced 
                    computer vision to detect PCOS-related features and provide more accurate predictions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Heart className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            PCOS Risk Assessment
          </h1>
          <p className="text-lg text-gray-600">
            Complete this form to get your personalized PCOS risk prediction
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card">
          {renderStepContent()}

          {error && (
            <div className="mt-6 flex items-center space-x-2 text-danger-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Get Prediction
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Medical Disclaimer */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong>Medical Disclaimer:</strong> This tool is for informational purposes only and 
            should not replace professional medical advice. Please consult with a healthcare provider 
            for proper diagnosis and treatment.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PredictionForm
