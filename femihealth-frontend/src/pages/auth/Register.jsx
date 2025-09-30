import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, Heart, AlertCircle, Check } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser, loading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    getValues
  } = useForm()

  const watchPassword = watch('password', '')

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const onSubmit = async (data) => {
    console.log('Registration form data:', data)
    const { confirmPassword, age, ...userData } = data
    
    // Convert age to dateOfBirth (approximate)
    const currentYear = new Date().getFullYear()
    const birthYear = currentYear - parseInt(age)
    const dateOfBirth = `${birthYear}-01-01`
    
    const finalUserData = {
      ...userData,
      dateOfBirth
    }
    
    console.log('Final user data being sent:', finalUserData)
    const result = await registerUser(finalUserData)
    
    if (result.success) {
      navigate('/mfa-setup')
    }
  }

  const passwordRequirements = [
    { test: (pwd) => pwd.length >= 8, text: 'At least 8 characters' },
    { test: (pwd) => /[A-Z]/.test(pwd), text: 'One uppercase letter' },
    { test: (pwd) => /[a-z]/.test(pwd), text: 'One lowercase letter' },
    { test: (pwd) => /\d/.test(pwd), text: 'One number' },
    { test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), text: 'One special character' }
  ]

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-heading font-bold text-gray-900">
            Join FemiHealth
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your journey to better health
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  }
                })}
                type="text"
                autoComplete="given-name"
                className={`input-field ${errors.firstName ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-danger-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  }
                })}
                type="text"
                autoComplete="family-name"
                className={`input-field ${errors.lastName ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                placeholder="Last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-danger-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                {...register('age', {
                  required: 'Age is required',
                  min: {
                    value: 13,
                    message: 'Must be at least 13 years old'
                  },
                  max: {
                    value: 100,
                    message: 'Please enter a valid age'
                  }
                })}
                type="number"
                className={`input-field ${errors.age ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                placeholder="Age"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-danger-600">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                {...register('phone', {
                  pattern: {
                    value: /^[\+]?[1-9][\d]{0,15}$/,
                    message: 'Invalid phone number'
                  }
                })}
                type="tel"
                autoComplete="tel"
                className={`input-field ${errors.phone ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                placeholder="+254700000000"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-danger-600">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  validate: {
                    length: (value) => value.length >= 8 || 'Password must be at least 8 characters',
                    uppercase: (value) => /[A-Z]/.test(value) || 'Password must contain an uppercase letter',
                    lowercase: (value) => /[a-z]/.test(value) || 'Password must contain a lowercase letter',
                    number: (value) => /\d/.test(value) || 'Password must contain a number',
                    special: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Password must contain a special character'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input-field pr-10 ${errors.password ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                placeholder="Create a password"
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

            {/* Password Requirements */}
            {watchPassword && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    {req.test(watchPassword) ? (
                      <Check className="h-3 w-3 text-success-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-gray-300" />
                    )}
                    <span className={req.test(watchPassword) ? 'text-success-600' : 'text-gray-500'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {errors.password && (
              <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === getValues('password') || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`input-field pr-10 ${errors.confirmPassword ? 'border-danger-300 focus:ring-danger-500' : ''}`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start">
            <input
              {...register('agreeToTerms', {
                required: 'You must agree to the terms and conditions'
              })}
              id="agree-terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-danger-600">{errors.agreeToTerms.message}</p>
          )}

          <div className="flex items-start">
            <input
              {...register('subscribeNewsletter')}
              id="subscribe-newsletter"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
            />
            <label htmlFor="subscribe-newsletter" className="ml-2 block text-sm text-gray-700">
              Subscribe to our newsletter for health tips and updates
            </label>
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
            {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
          </button>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
