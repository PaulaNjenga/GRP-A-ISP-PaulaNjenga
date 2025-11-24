import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AccessibilityProvider } from './components/ui/AccessibilityProvider'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import MFASetup from './pages/auth/MFASetup'
import Dashboard from './pages/Dashboard'
import PredictionForm from './pages/PredictionForm'
import PCOSPrediction from './pages/PCOSPrediction'
import Results from './pages/Results'
import Education from './pages/Education'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import DiagnosisForm from './pages/DiagnosisForm'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, doctorOnly = false, roles = [] }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  if (doctorOnly && user.role !== 'doctor') {
    return <Navigate to="/dashboard" replace />
  }
  
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading, state } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  // Allow access to login page if MFA is required (user is partially authenticated)
  if (user && !state?.mfaRequired) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-grow" tabIndex="-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/education" element={<Education />} />
          
          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/mfa-setup" 
            element={
              <ProtectedRoute>
                <MFASetup />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/predict" 
            element={
              <ProtectedRoute>
                <PredictionForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pcos-prediction" 
            element={
              <ProtectedRoute>
                <PCOSPrediction />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/results/:id" 
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Doctor Routes */}
          <Route 
            path="/doctor-dashboard" 
            element={
              <ProtectedRoute doctorOnly>
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/diagnosis/create" 
            element={
              <ProtectedRoute doctorOnly>
                <DiagnosisForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  )
}

export default App
