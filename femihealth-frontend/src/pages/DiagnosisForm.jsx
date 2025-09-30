import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const DiagnosisForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    // Tabular data
    age: '',
    weight: '',
    height: '',
    bmi: '',
    glucose: '',
    insulin: '',
    testosterone: '',
    lhFshRatio: '',
    irregularPeriods: false,
    weightGain: false,
    acne: false,
    hairGrowth: false,
    // Test results
    testResults: {
      testosterone: '',
      insulin: '',
      glucose: '',
      lhFshRatio: '',
      other: ''
    },
    // Clinical information
    clinicalNotes: '',
    diagnosis: '',
    treatmentPlan: '',
    followUpDate: ''
  });
  const [files, setFiles] = useState({
    ultrasound: null,
    testResults: [],
    documents: []
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('testResults.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        testResults: {
          ...prev.testResults,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => ({
      ...prev,
      [type]: type === 'ultrasound' ? selectedFiles[0] : selectedFiles
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Add form data
      formDataToSend.append('patientId', formData.patientId);
      formDataToSend.append('inputData', JSON.stringify({
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        bmi: parseFloat(formData.bmi),
        glucose: parseFloat(formData.glucose),
        insulin: parseFloat(formData.insulin),
        testosterone: parseFloat(formData.testosterone),
        lhFshRatio: parseFloat(formData.lhFshRatio),
        irregularPeriods: formData.irregularPeriods,
        weightGain: formData.weightGain,
        acne: formData.acne,
        hairGrowth: formData.hairGrowth
      }));
      formDataToSend.append('testResults', JSON.stringify(formData.testResults));
      formDataToSend.append('clinicalNotes', formData.clinicalNotes);
      formDataToSend.append('diagnosis', formData.diagnosis);
      formDataToSend.append('treatmentPlan', formData.treatmentPlan);
      formDataToSend.append('followUpDate', formData.followUpDate);

      // Add files
      if (files.ultrasound) {
        formDataToSend.append('ultrasound', files.ultrasound);
      }
      files.testResults.forEach(file => {
        formDataToSend.append('testResults', file);
      });
      files.documents.forEach(file => {
        formDataToSend.append('documents', file);
      });

      const response = await fetch('/api/doctor/diagnosis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        alert('Diagnosis created successfully!');
        navigate('/doctor-dashboard');
      } else {
        alert('Error creating diagnosis: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating diagnosis:', error);
      alert('Error creating diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create Medical Diagnosis</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive PCOS assessment with medical data and file uploads
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient ID (Anonymous)
                  </label>
                  <input
                    type="text"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    placeholder="Enter patient ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Clinical Measurements */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Measurements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    name="bmi"
                    value={formData.bmi}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Laboratory Results */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Laboratory Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Testosterone Level
                  </label>
                  <input
                    type="text"
                    name="testResults.testosterone"
                    value={formData.testResults.testosterone}
                    onChange={handleInputChange}
                    placeholder="e.g., elevated, normal, low"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insulin Level
                  </label>
                  <input
                    type="text"
                    name="testResults.insulin"
                    value={formData.testResults.insulin}
                    onChange={handleInputChange}
                    placeholder="e.g., elevated, normal, low"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Glucose Level
                  </label>
                  <input
                    type="text"
                    name="testResults.glucose"
                    value={formData.testResults.glucose}
                    onChange={handleInputChange}
                    placeholder="e.g., elevated, normal, low"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LH/FSH Ratio
                  </label>
                  <input
                    type="text"
                    name="testResults.lhFshRatio"
                    value={formData.testResults.lhFshRatio}
                    onChange={handleInputChange}
                    placeholder="e.g., elevated, normal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Symptoms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'irregularPeriods', label: 'Irregular Periods' },
                  { name: 'weightGain', label: 'Weight Gain' },
                  { name: 'acne', label: 'Acne' },
                  { name: 'hairGrowth', label: 'Excessive Hair Growth' }
                ].map((symptom) => (
                  <div key={symptom.name} className="flex items-center">
                    <input
                      type="checkbox"
                      name={symptom.name}
                      checked={formData[symptom.name]}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">{symptom.label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* File Uploads */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Files</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ultrasound Images
                  </label>
                  <input
                    type="file"
                    accept="image/*,.dcm"
                    onChange={(e) => handleFileChange(e, 'ultrasound')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Results (PDF, Images)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileChange(e, 'testResults')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Documents
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, 'documents')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Clinical Notes and Diagnosis */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Assessment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinical Notes
                  </label>
                  <textarea
                    name="clinicalNotes"
                    value={formData.clinicalNotes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Patient presentation, symptoms, clinical observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    placeholder="e.g., PCOS - Polycystic Ovary Syndrome"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Treatment Plan
                  </label>
                  <textarea
                    name="treatmentPlan"
                    value={formData.treatmentPlan}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Recommended treatment, medications, lifestyle changes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/doctor-dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating Diagnosis...' : 'Create Diagnosis'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisForm;
