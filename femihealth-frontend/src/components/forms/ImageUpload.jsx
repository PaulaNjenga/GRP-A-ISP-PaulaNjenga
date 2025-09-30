import React, { useState, useRef } from 'react'
import { Upload, X, Image, AlertCircle, Check } from 'lucide-react'

const ImageUpload = ({ onImageSelect, maxSize = 10, acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg'] }) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, JPG)'
    }

    // Check file size (convert MB to bytes)
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }

    return null
  }

  const handleFile = async (file) => {
    setError('')
    setUploading(true)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setUploading(false)
      return
    }

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      
      const imageData = {
        file,
        preview: previewUrl,
        name: file.name,
        size: file.size,
        type: file.type
      }

      setUploadedImage(imageData)
      onImageSelect(imageData)
    } catch (err) {
      setError('Failed to process image')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview)
    }
    setUploadedImage(null)
    setError('')
    onImageSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={acceptedTypes.join(',')}
        onChange={handleChange}
      />

      {!uploadedImage ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
            dragActive
              ? 'border-primary-400 bg-primary-50'
              : error
              ? 'border-danger-300 bg-danger-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className={`mx-auto h-12 w-12 mb-4 ${
              dragActive ? 'text-primary-500' : 'text-gray-400'
            }`} />
            
            <div className="mb-4">
              <p className="text-lg font-medium text-gray-900 mb-2">
                {dragActive ? 'Drop your image here' : 'Upload ultrasound image'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop your image here, or{' '}
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                  disabled={uploading}
                >
                  browse files
                </button>
              </p>
            </div>

            <div className="text-xs text-gray-400">
              <p>Supported formats: JPEG, PNG, JPG</p>
              <p>Maximum size: {maxSize}MB</p>
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="loading-spinner mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Processing image...</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <img
                src={uploadedImage.preview}
                alt="Uploaded ultrasound"
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            </div>
            
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadedImage.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadedImage.size)}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={removeImage}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-2 flex items-center space-x-2">
                <Check className="h-4 w-4 text-success-500" />
                <span className="text-xs text-success-600">Image uploaded successfully</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleButtonClick}
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              Upload different image
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center space-x-2 text-danger-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p className="mb-1">
          <strong>Tips for better results:</strong>
        </p>
        <ul className="space-y-1 ml-4">
          <li>• Ensure the image is clear and well-lit</li>
          <li>• Include relevant anatomical structures</li>
          <li>• Avoid blurry or low-quality images</li>
          <li>• DICOM format preferred if available</li>
        </ul>
      </div>
    </div>
  )
}

export default ImageUpload
