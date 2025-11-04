import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictionAPI } from '../services/api';
import { Heart, AlertCircle, Activity, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const SimplePredictionForm = () => {
  const [formData, setFormData] = useState({
    beta_hcg_i: '',
    beta_hcg_ii: '',
    amh: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      // Convert string values to numbers
      const data = {
        beta_hcg_i: parseFloat(formData.beta_hcg_i),
        beta_hcg_ii: parseFloat(formData.beta_hcg_ii),
        amh: parseFloat(formData.amh)
      };

      const response = await predictionAPI.predictTabular(data);
      
      if (response.success) {
        setResult(response.prediction);
      } else {
        setError('Prediction failed. Please try again.');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.message || 'Failed to get prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600'
        };
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PCOS Risk Assessment
          </h1>
          <p className="text-gray-600">
            Enter your hormonal marker values for personalized risk analysis
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Required Hormonal Markers</p>
                <p>Please enter your β-hCG and AMH test results. These values help assess PCOS risk.</p>
              </div>
            </div>

            {/* β-hCG I Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-pink-500" />
                  1st β-hCG (mIU/mL) *
                </div>
              </label>
              <input
                type="number"
                name="beta_hcg_i"
                step="0.01"
                min="0"
                value={formData.beta_hcg_i}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="Enter 1st β-hCG value"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                First beta-human chorionic gonadotropin measurement
              </p>
            </div>

            {/* β-hCG II Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-purple-500" />
                  2nd β-hCG (mIU/mL) *
                </div>
              </label>
              <input
                type="number"
                name="beta_hcg_ii"
                step="0.01"
                min="0"
                value={formData.beta_hcg_ii}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter 2nd β-hCG value"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Second beta-human chorionic gonadotropin measurement
              </p>
            </div>

            {/* AMH Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                  AMH (ng/mL) *
                </div>
              </label>
              <input
                type="number"
                name="amh"
                step="0.01"
                min="0"
                value={formData.amh}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter AMH value"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Anti-Müllerian Hormone level
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner className="w-5 h-5 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Get PCOS Risk Score
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Card */}
        {result && (
          <div className={`${getRiskColor(result.result?.riskLevel).bg} border-2 ${getRiskColor(result.result?.riskLevel).border} rounded-2xl shadow-xl p-8 animate-fade-in`}>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getRiskColor(result.result?.riskLevel).bg} border-4 ${getRiskColor(result.result?.riskLevel).border} mb-4`}>
                <Heart className={`w-10 h-10 ${getRiskColor(result.result?.riskLevel).icon}`} />
              </div>
              <h3 className={`text-2xl font-bold ${getRiskColor(result.result?.riskLevel).text} mb-2`}>
                Risk Level: {result.result?.riskLevel?.toUpperCase()}
              </h3>
              <p className={`text-lg ${getRiskColor(result.result?.riskLevel).text}`}>
                Risk Score: {((result.result?.probability || 0) * 100).toFixed(1)}%
              </p>
            </div>

            {/* Prediction Details */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Analysis Details</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Prediction:</strong> {result.result?.prediction}</p>
                <p><strong>Confidence:</strong> {((result.result?.confidence || 0) * 100).toFixed(1)}%</p>
                {result.result?.details?.message && (
                  <p className="mt-3 text-gray-600">{result.result.details.message}</p>
                )}
              </div>
            </div>

            {/* Input Values */}
            {result.result?.details?.values && (
              <div className="bg-white rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Your Values</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">β-hCG I</p>
                    <p className="font-semibold text-gray-900">{result.result.details.values.beta_hcg_i} mIU/mL</p>
                  </div>
                  <div>
                    <p className="text-gray-500">β-hCG II</p>
                    <p className="font-semibold text-gray-900">{result.result.details.values.beta_hcg_ii} mIU/mL</p>
                  </div>
                  <div>
                    <p className="text-gray-500">AMH</p>
                    <p className="font-semibold text-gray-900">{result.result.details.values.amh} ng/mL</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Recommendations</h4>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`w-2 h-2 rounded-full ${getRiskColor(rec.priority).icon} mt-2 mr-3 flex-shrink-0`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{rec.title}</p>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setFormData({ beta_hcg_i: '', beta_hcg_ii: '', amh: '' });
                }}
                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                New Assessment
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                View History
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            ⚠️ This tool provides risk assessment only and should not replace professional medical advice.
            Please consult with a healthcare provider for proper diagnosis and treatment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimplePredictionForm;
