// Accessibility utilities for the FemiHealth application

/**
 * Manages focus for modal dialogs and overlays
 */
export class FocusManager {
  constructor() {
    this.previousFocus = null
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')
  }

  trapFocus(element) {
    this.previousFocus = document.activeElement
    const focusableElements = element.querySelectorAll(this.focusableElements)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    })

    firstElement?.focus()
  }

  releaseFocus() {
    if (this.previousFocus) {
      this.previousFocus.focus()
      this.previousFocus = null
    }
  }
}

/**
 * Announces messages to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Generates unique IDs for form elements
 */
export const generateId = (prefix = 'element') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validates color contrast ratios
 */
export const checkColorContrast = (foreground, background) => {
  // Simple contrast ratio calculation
  const getLuminance = (color) => {
    const rgb = parseInt(color.slice(1), 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  
  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7
  }
}

/**
 * Keyboard navigation helpers
 */
export const keyboardNavigation = {
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End'
  },

  handleButtonKeydown: (event, callback) => {
    if (event.key === keyboardNavigation.KEYS.ENTER || event.key === keyboardNavigation.KEYS.SPACE) {
      event.preventDefault()
      callback(event)
    }
  },

  handleEscapeKey: (event, callback) => {
    if (event.key === keyboardNavigation.KEYS.ESCAPE) {
      callback(event)
    }
  }
}

/**
 * Screen reader utilities
 */
export const screenReader = {
  // Hide content from screen readers
  hideFromScreenReader: (element) => {
    element.setAttribute('aria-hidden', 'true')
  },

  // Show content to screen readers only
  showToScreenReaderOnly: (element) => {
    element.className += ' sr-only'
  },

  // Set accessible name
  setAccessibleName: (element, name) => {
    element.setAttribute('aria-label', name)
  },

  // Set accessible description
  setAccessibleDescription: (element, description) => {
    const descId = generateId('desc')
    const descElement = document.createElement('div')
    descElement.id = descId
    descElement.className = 'sr-only'
    descElement.textContent = description
    
    document.body.appendChild(descElement)
    element.setAttribute('aria-describedby', descId)
  }
}

/**
 * Form accessibility helpers
 */
export const formAccessibility = {
  // Associate label with form control
  associateLabel: (label, control) => {
    const id = control.id || generateId('control')
    control.id = id
    label.setAttribute('for', id)
  },

  // Set required field indicators
  setRequired: (element, isRequired = true) => {
    element.setAttribute('aria-required', isRequired.toString())
    if (isRequired) {
      element.setAttribute('required', '')
    } else {
      element.removeAttribute('required')
    }
  },

  // Set field validation state
  setValidationState: (element, isValid, errorMessage = '') => {
    if (isValid) {
      element.setAttribute('aria-invalid', 'false')
      element.removeAttribute('aria-describedby')
    } else {
      element.setAttribute('aria-invalid', 'true')
      if (errorMessage) {
        const errorId = generateId('error')
        const errorElement = document.createElement('div')
        errorElement.id = errorId
        errorElement.className = 'text-danger-600 text-sm mt-1'
        errorElement.textContent = errorMessage
        
        element.parentNode.appendChild(errorElement)
        element.setAttribute('aria-describedby', errorId)
      }
    }
  }
}

/**
 * Loading state accessibility
 */
export const loadingAccessibility = {
  setLoadingState: (element, isLoading, loadingText = 'Loading...') => {
    if (isLoading) {
      element.setAttribute('aria-busy', 'true')
      element.setAttribute('aria-live', 'polite')
      announceToScreenReader(loadingText)
    } else {
      element.setAttribute('aria-busy', 'false')
      element.removeAttribute('aria-live')
    }
  }
}

/**
 * Skip links for keyboard navigation
 */
export const createSkipLink = (targetId, text = 'Skip to main content') => {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = text
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded z-50'
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView()
    }
  })
  
  return skipLink
}

export default {
  FocusManager,
  announceToScreenReader,
  generateId,
  checkColorContrast,
  keyboardNavigation,
  screenReader,
  formAccessibility,
  loadingAccessibility,
  createSkipLink
}
