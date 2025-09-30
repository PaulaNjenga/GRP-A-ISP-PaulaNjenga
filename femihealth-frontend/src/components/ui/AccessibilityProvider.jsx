import React, { createContext, useContext, useEffect, useState } from 'react'
import { announceToScreenReader, createSkipLink } from '../../utils/accessibility'

const AccessibilityContext = createContext()

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

export const AccessibilityProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([])
  const [highContrastMode, setHighContrastMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [fontSize, setFontSize] = useState('normal')

  useEffect(() => {
    // Check for user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    
    setReducedMotion(prefersReducedMotion)
    setHighContrastMode(prefersHighContrast)

    // Add skip link to document
    const skipLink = createSkipLink('main-content', 'Skip to main content')
    document.body.insertBefore(skipLink, document.body.firstChild)

    // Apply accessibility classes to body
    document.body.classList.add('accessibility-enhanced')
    
    return () => {
      document.body.classList.remove('accessibility-enhanced')
    }
  }, [])

  useEffect(() => {
    // Apply high contrast mode
    if (highContrastMode) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [highContrastMode])

  useEffect(() => {
    // Apply reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }, [reducedMotion])

  useEffect(() => {
    // Apply font size
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [fontSize])

  const announce = (message, priority = 'polite') => {
    announceToScreenReader(message, priority)
    setAnnouncements(prev => [...prev, { message, priority, timestamp: Date.now() }])
    
    // Clean up old announcements
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => Date.now() - a.timestamp < 5000))
    }, 5000)
  }

  const toggleHighContrast = () => {
    setHighContrastMode(prev => !prev)
    announce(highContrastMode ? 'High contrast mode disabled' : 'High contrast mode enabled')
  }

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev)
    announce(reducedMotion ? 'Animations enabled' : 'Animations reduced')
  }

  const changeFontSize = (size) => {
    setFontSize(size)
    announce(`Font size changed to ${size}`)
  }

  const value = {
    announce,
    highContrastMode,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    fontSize,
    changeFontSize,
    announcements
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="accessibility-announcements"
      >
        {announcements.map((announcement, index) => (
          <div key={`${announcement.timestamp}-${index}`}>
            {announcement.message}
          </div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  )
}

// Accessibility Settings Panel Component
export const AccessibilityPanel = ({ isOpen, onClose }) => {
  const { 
    highContrastMode, 
    toggleHighContrast, 
    reducedMotion, 
    toggleReducedMotion,
    fontSize,
    changeFontSize 
  } = useAccessibility()

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 id="accessibility-title" className="text-xl font-semibold text-gray-900">
            Accessibility Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="Close accessibility settings"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* High Contrast Toggle */}
          <div className="flex items-center justify-between">
            <label htmlFor="high-contrast" className="text-sm font-medium text-gray-700">
              High Contrast Mode
            </label>
            <button
              id="high-contrast"
              onClick={toggleHighContrast}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                highContrastMode ? 'bg-primary-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={highContrastMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  highContrastMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between">
            <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-700">
              Reduce Motion
            </label>
            <button
              id="reduced-motion"
              onClick={toggleReducedMotion}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                reducedMotion ? 'bg-primary-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={reducedMotion}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Font Size Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Font Size
            </label>
            <div className="space-y-2">
              {['small', 'normal', 'large', 'extra-large'].map((size) => (
                <label key={size} className="flex items-center">
                  <input
                    type="radio"
                    name="font-size"
                    value={size}
                    checked={fontSize === size}
                    onChange={() => changeFontSize(size)}
                    className="mr-2 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {size.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
