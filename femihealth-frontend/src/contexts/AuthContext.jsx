import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'

// Auth Context
const AuthContext = createContext()

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
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
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
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
      if (token) {
        try {
          const response = await authAPI.verifyToken()
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.data.user,
              token: token
            }
          })
        } catch (error) {
          console.warn('Token verification failed:', error.response?.status)
          localStorage.removeItem('femihealth_token')
          dispatch({ type: AUTH_ACTIONS.LOGOUT })
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    checkAuth()
  }, [])

  // Login function
  const login = async (credentials) => {
    console.log('Login function called with:', credentials)
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })
    try {
      console.log('Making API call to login...')
      const response = await authAPI.login(credentials)
      console.log('Login response:', response)
      const { user, token } = response.data.data
      
      localStorage.setItem('femihealth_token', token)
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      })
      
      return { success: true, user }
    } catch (error) {
      console.error('Login error:', error)
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
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }

  // Setup MFA function
  const setupMFA = async () => {
    try {
      const response = await authAPI.setupMFA()
      return { success: true, data: response.data.data }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'MFA setup failed'
      return { success: false, error: errorMessage }
    }
  }

  // Verify MFA function
  const verifyMFA = async (token) => {
    try {
      const response = await authAPI.verifyMFA(token)
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: response.data.user
      })
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'MFA verification failed'
      return { success: false, error: errorMessage }
    }
  }

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    setupMFA,
    verifyMFA,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
export default AuthProvider
