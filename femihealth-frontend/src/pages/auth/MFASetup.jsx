import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Heart, AlertCircle, Check, Copy, Smartphone } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const MFASetup = () => {
  const [step, setStep] = useState(1)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [copied, setCopied] = useState(false)
  const { setupMFA, verifyMFA, loading, error, clearError } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    initializeMFA()
  }, [])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const initializeMFA = async () => {
    console.log('🔧 Initializing MFA setup...')
    const result = await setupMFA()
    console.log('📋 MFA setup result:', result)
    
    if (result.success) {
      const { secret, qrCode } = result.data
      console.log('✅ Got secret and QR code from backend')
      setSecret(secret)
      setQrCodeUrl(qrCode) // Backend already provides the data URL
    } else {
      console.error('❌ MFA setup failed:', result.error)
    }
  }

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy secret:', err)
    }
  }

  const handleVerification = async (e) => {
    e.preventDefault()
    if (verificationCode.length === 6) {
      const result = await verifyMFA(verificationCode)
      if (result.success) {
        setStep(3)
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  if (step === 3) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="animate-fade-in">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-6">
              <Check className="h-8 w-8 text-success-600" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              MFA Setup Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Your account is now secured with two-factor authentication.
            </p>
            <LoadingSpinner className="mb-4" />
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-heading font-bold text-gray-900">
            Secure Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up two-factor authentication for enhanced security
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
        </div>

        {step === 1 && (
          <div className="card animate-slide-up">
            <div className="text-center mb-6">
              <Smartphone className="mx-auto h-12 w-12 text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Install Authenticator App
              </h3>
              <p className="text-sm text-gray-600">
                Download and install an authenticator app on your mobile device
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">G</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Google Authenticator</p>
                  <p className="text-xs text-gray-500">Free • iOS & Android</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-sm">A</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Authy</p>
                  <p className="text-xs text-gray-500">Free • iOS & Android</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">M</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Microsoft Authenticator</p>
                  <p className="text-xs text-gray-500">Free • iOS & Android</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full btn-primary"
            >
              I've Installed an App
            </button>

            <div className="text-center mt-4">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card animate-slide-up">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Scan QR Code
              </h3>
              <p className="text-sm text-gray-600">
                Open your authenticator app and scan this QR code
              </p>
            </div>

            {qrCodeUrl ? (
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-6">
                <LoadingSpinner size="lg" />
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Can't scan? Enter this code manually:
              </p>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                  {secret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 6-digit code from your app
                </label>
                <input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength="6"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-danger-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Verify & Complete Setup'}
              </button>
            </form>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Security Benefits */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Why enable 2FA?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Protects your sensitive health data</li>
            <li>• Prevents unauthorized access</li>
            <li>• Required for certain features</li>
            <li>• Industry standard security practice</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MFASetup
