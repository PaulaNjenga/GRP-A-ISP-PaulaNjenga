import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, Heart, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [mfaToken, setMfaToken] = useState('')
  const { login, verifyMFA, loading, error, clearError, clearMFA, clearAllTokens, state } = useAuth()
  const navigate = useNavigate()
  
  // Use mfaRequired from AuthContext instead of local state
  const showMFA = state?.mfaRequired || false

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const watchedFields = watch()

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  useEffect(() => {
    console.log('🔄 showMFA state changed:', showMFA)
  }, [showMFA])

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data)
    const result = await login(data)
    console.log('Login result:', result)
    
    if (result.success) {
      // Check if MFA is required
      if (result.mfaRequired) {
        console.log('🔒 MFA required, AuthContext will handle state')
        // AuthContext already set mfaRequired to true, no need to set local state
      } else {
        console.log('✅ No MFA required, navigating to dashboard')
        navigate('/dashboard')
      }
    } else {
      console.log('❌ Login failed:', result.error)
    }
  }

  const handleMFASubmit = async (e) => {
    e.preventDefault()
    if (mfaToken.length === 6) {
      const result = await verifyMFA(mfaToken)
      if (result.success) {
        navigate('/dashboard')
      }
    }
  }

  console.log('🔍 Current showMFA state:', showMFA)
  
  if (showMFA) {
    console.log('🔒 Rendering MFA form')
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary-600" />
            <h2 className="mt-6 text-3xl font-heading font-bold text-gray-900">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handleMFASubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="mfa-token" className="sr-only">
                MFA Code
              </label>
              <input
                id="mfa-token"
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
              disabled={loading || mfaToken.length !== 6}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Verify'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => clearMFA()}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-heading font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your FemiHealth account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                autoComplete="email"
                className={`input-field ${errors.email ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input-field pr-10 ${errors.password ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-danger-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Sign in'}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign up
              </Link>
            </span>
          </div>
        </form>

        {/* Demo Account Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Test Account</h3>
          <p className="text-xs text-blue-600 mb-2">
            Try FemiHealth with this test account:
          </p>
          <div className="text-xs text-blue-700 space-y-1">
            <div>Email: test@test.com</div>
            <div>Password: test123456</div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                document.querySelector('input[name="email"]').value = 'test@test.com';
                document.querySelector('input[name="password"]').value = 'test123456';
              }}
              className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
            >
              Fill credentials
            </button>
            <button
              type="button"
              onClick={clearAllTokens}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
            >
              Clear tokens
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
