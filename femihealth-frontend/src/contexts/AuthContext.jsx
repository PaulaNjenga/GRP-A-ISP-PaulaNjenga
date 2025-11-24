import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'

// Auth Context
const AuthContext = createContext()

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  MFA_REQUIRED: 'MFA_REQUIRED',
  CLEAR_MFA: 'CLEAR_MFA',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      }
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      }
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        error: action.payload
      }
    case AUTH_ACTIONS.MFA_REQUIRED:
      return {
        ...state,
        loading: false,
        tempToken: action.payload.tempToken,
        mfaRequired: true,
        error: null
      }
    case AUTH_ACTIONS.CLEAR_MFA:
      return {
        ...state,
        tempToken: null,
        mfaRequired: false,
        error: null
      }
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        tempToken: null,
        mfaRequired: false,
        error: null,
        loading: false
      }
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload
      }
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      }
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

// Initial State
const initialState = {
  user: null,
  token: localStorage.getItem('femihealth_token'),
  tempToken: null,
  mfaRequired: false,
  loading: true,
  error: null
}

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('femihealth_token')
      const tempToken = localStorage.getItem('femihealth_temp_token')
      
      if (token) {
        try {
          console.log('🔍 Verifying existing token...')
          const response = await authAPI.verifyToken()
          console.log('✅ Token valid, user logged in')
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.data.user,
              token: token
            }
          })
        } catch (error) {
          console.warn('⚠️ Token verification failed:', error.response?.status)
          console.log('🧹 Clearing invalid tokens...')
          localStorage.removeItem('femihealth_token')
          localStorage.removeItem('femihealth_temp_token')
          dispatch({ type: AUTH_ACTIONS.LOGOUT })
        }
      } else {
        // No token, but clean up any temp tokens
        if (tempToken) {
          console.log('🧹 Cleaning up orphaned temp token...')
          localStorage.removeItem('femihealth_temp_token')
        }
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (credentials) => {
    console.log('🔐 Login function called with:', credentials)
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })
    try {
      console.log('📡 Making API call to login...')
      const response = await authAPI.login(credentials)
      console.log('✅ Login response received:', response)
      console.log('📋 Response data:', response.data)
      
      // Check if MFA is required
      if (response.data.mfaRequired) {
        console.log('🔒 MFA required, storing temp token')
        localStorage.setItem('femihealth_temp_token', response.data.tempToken)
        dispatch({
          type: AUTH_ACTIONS.MFA_REQUIRED,
          payload: { tempToken: response.data.tempToken }
        })
        return { 
          success: true, 
          mfaRequired: true, 
          tempToken: response.data.tempToken,
          message: response.data.message 
        }
      }
      
      // Normal login success (no MFA)
      console.log('✅ Normal login success (no MFA)')
      const { user, token } = response.data.data || response.data
      console.log('👤 User data:', user)
      console.log('🎫 Token received:', token ? 'Yes' : 'No')
      
      localStorage.setItem('femihealth_token', token)
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      })
      
      return { success: true, user }
    } catch (error) {
      console.error('❌ Login error:', error)
      console.error('📄 Error response:', error.response?.data)
      console.error('🔢 Error status:', error.response?.status)
      const errorMessage = error.response?.data?.message || 'Login failed'
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  // Register function
  const register = async (userData) => {
    console.log('Register function called with:', userData)
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })
    try {
      console.log('Making API call to register...')
      const response = await authAPI.register(userData)
      console.log('Register response:', response)
      const { user, token } = response.data.data
      
      localStorage.setItem('femihealth_token', token)
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      })
      
      return { success: true, user }
    } catch (error) {
      console.error('Register error:', error)
      const errorMessage = error.response?.data?.message || 'Registration failed'
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('femihealth_token')
      localStorage.removeItem('femihealth_temp_token')
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }

  // Setup MFA function
  const setupMFA = async () => {
    try {
      console.log('🔧 Setting up MFA...')
      const response = await authAPI.setupMFA()
      console.log('✅ MFA setup response status:', response.status)
      console.log('✅ MFA setup response data:', response.data)
      
      // Check if response is successful
      if (response.status === 200) {
        if (response.data.success) {
          console.log('✅ MFA setup successful!')
          return { success: true, data: response.data }
        } else if (response.data.qrCode && response.data.secret) {
          // Handle case where backend returns data without explicit success field
          console.log('✅ MFA setup successful (legacy format)!')
          return { success: true, data: { ...response.data, success: true } }
        } else {
          console.error('❌ MFA setup failed - missing required data')
          console.error('❌ Response data:', response.data)
          return { success: false, error: 'Missing QR code or secret in response' }
        }
      } else {
        console.error('❌ MFA setup failed - HTTP error:', response.status)
        return { success: false, error: `HTTP ${response.status}` }
      }
    } catch (error) {
      console.error('❌ MFA setup error:', error)
      console.error('❌ Error response:', error.response)
      const errorMessage = error.response?.data?.message || 'MFA setup failed'
      return { success: false, error: errorMessage }
    }
  }

  // Verify MFA function
  const verifyMFA = async (mfaToken) => {
    try {
      const response = await authAPI.verifyMFA(mfaToken)
      console.log('✅ MFA verification response:', response.data)
      
      const { user, token } = response.data.data || response.data
      
      // Store the full access token and clear temp token
      localStorage.setItem('femihealth_token', token)
      localStorage.removeItem('femihealth_temp_token')
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      })
      
      return { success: true, user }
    } catch (error) {
      console.error('❌ MFA verification error:', error)
      const errorMessage = error.response?.data?.message || 'MFA verification failed'
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Clear MFA state
  const clearMFA = () => {
    console.log('🧹 Clearing MFA state...')
    localStorage.removeItem('femihealth_temp_token')
    dispatch({ type: AUTH_ACTIONS.CLEAR_MFA })
  }

  // Clear all tokens and reset auth state
  const clearAllTokens = () => {
    console.log('🧹 Clearing all tokens and resetting auth state...')
    localStorage.removeItem('femihealth_token')
    localStorage.removeItem('femihealth_temp_token')
    dispatch({ type: AUTH_ACTIONS.LOGOUT })
  }

  const value = {
    user: state.user,
    token: state.token,
    tempToken: state.tempToken,
    mfaRequired: state.mfaRequired,
    loading: state.loading,
    error: state.error,
    state,
    login,
    register,
    logout,
    setupMFA,
    verifyMFA,
    clearError,
    clearMFA,
    clearAllTokens
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
export default AuthProvider
