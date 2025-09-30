import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { dashboardAPI, fileAPI } from '../services/api'
import {
  User,
  Edit3,
  Save,
  X,
  Camera,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Heart,
  Activity,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const Profile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    phone: '',
    address: '',
    medicalHistory: [],
    medications: [],
    allergies: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await dashboardAPI.getProfile()
      const profileData = response.data.data
      setProfile(profileData)
      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        dateOfBirth: profileData.dateOfBirth || '',
        height: profileData.height || '',
        weight: profileData.weight || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        medicalHistory: profileData.medicalHistory || [],
        medications: profileData.medications || [],
        allergies: profileData.allergies || [],
        emergencyContact: profileData.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        }
      })
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)
      const response = await fileAPI.uploadFile(file, 'profile_photo')
      setSuccess('Profile photo updated successfully')
      // In a real app, you'd update the profile with the new photo URL
      console.log('Photo uploaded:', response.data)
    } catch (err) {
      console.error('Photo upload error:', err)
      setError('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      
      await dashboardAPI.updateProfile(formData)
      setProfile({ ...profile, ...formData })
      setEditing(false)
      setSuccess('Profile updated successfully')
    } catch (err) {
      console.error('Profile update error:', err)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const calculateBMI = (height, weight) => {
    if (!height || !weight) return null
    const heightInM = height / 100
    return (weight / (heightInM * heightInM)).toFixed(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your personal information and health data</p>
          </div>
          
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    email: profile.email || '',
                    dateOfBirth: profile.dateOfBirth || '',
                    height: profile.height || '',
                    weight: profile.weight || '',
                    phone: profile.phone || '',
                    address: profile.address || '',
                    medicalHistory: profile.medicalHistory || [],
                    medications: profile.medications || [],
                    allergies: profile.allergies || [],
                    emergencyContact: profile.emergencyContact || {
                      name: '',
                      phone: '',
                      relationship: ''
                    }
                  })
                }}
                className="btn-outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo & Basic Info */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </div>
                  
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50">
                      <Camera className="h-4 w-4 text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                  
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-4">
                  {profile?.firstName} {profile?.lastName}
                </h2>
                <p className="text-gray-600">{profile?.email}</p>
                
                {profile?.dateOfBirth && (
                  <p className="text-sm text-gray-500 mt-2">
                    Age: {calculateAge(profile.dateOfBirth)} years
                  </p>
                )}
              </div>

              {/* Health Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Health Stats</h3>
                <div className="space-y-3">
                  {profile?.height && profile?.weight && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">BMI</span>
                      <span className="text-sm font-medium text-gray-900">
                        {calculateBMI(profile.height, profile.weight)}
                      </span>
                    </div>
                  )}
                  
                  {profile?.height && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Height</span>
                      <span className="text-sm font-medium text-gray-900">
                        {profile.height} cm
                      </span>
                    </div>
                  )}
                  
                  {profile?.weight && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Weight</span>
                      <span className="text-sm font-medium text-gray-900">
                        {profile.weight} kg
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.firstName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.lastName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900">{profile?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date of Birth
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="input-field"
                      min="100"
                      max="250"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.height ? `${profile.height} cm` : 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="input-field"
                      min="30"
                      max="300"
                      step="0.1"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.weight ? `${profile.weight} kg` : 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Address
                  </label>
                  {editing ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="input-field"
                      rows="2"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.address || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-primary-600" />
                Medical Information
              </h3>

              {/* Medical History */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical History
                </label>
                {editing ? (
                  <div className="space-y-2">
                    {formData.medicalHistory.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('medicalHistory', index, e.target.value)}
                          className="input-field flex-1"
                          placeholder="Enter medical condition"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('medicalHistory', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('medicalHistory')}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Medical Condition
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {profile?.medicalHistory?.length > 0 ? (
                      profile.medicalHistory.map((item, index) => (
                        <p key={index} className="text-gray-900">• {item}</p>
                      ))
                    ) : (
                      <p className="text-gray-500">No medical history recorded</p>
                    )}
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                {editing ? (
                  <div className="space-y-2">
                    {formData.medications.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('medications', index, e.target.value)}
                          className="input-field flex-1"
                          placeholder="Enter medication name"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('medications', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('medications')}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Medication
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {profile?.medications?.length > 0 ? (
                      profile.medications.map((item, index) => (
                        <p key={index} className="text-gray-900">• {item}</p>
                      ))
                    ) : (
                      <p className="text-gray-500">No medications recorded</p>
                    )}
                  </div>
                )}
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                {editing ? (
                  <div className="space-y-2">
                    {formData.allergies.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleArrayChange('allergies', index, e.target.value)}
                          className="input-field flex-1"
                          placeholder="Enter allergy"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('allergies', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('allergies')}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      + Add Allergy
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {profile?.allergies?.length > 0 ? (
                      profile.allergies.map((item, index) => (
                        <p key={index} className="text-gray-900">• {item}</p>
                      ))
                    ) : (
                      <p className="text-gray-500">No allergies recorded</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary-600" />
                Emergency Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="emergencyContact.name"
                      value={formData.emergencyContact.name}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.emergencyContact?.name || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      name="emergencyContact.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.emergencyContact?.phone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  {editing ? (
                    <select
                      name="emergencyContact.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">Select relationship</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{profile?.emergencyContact?.relationship || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
