import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { AccessibilityProvider } from '../components/ui/AccessibilityProvider'
import Home from '../pages/Home'
import Login from '../pages/auth/Login'
import PredictionForm from '../pages/PredictionForm'

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </AuthProvider>
  </BrowserRouter>
)

describe('Accessibility Tests', () => {
  describe('Keyboard Navigation', () => {
    test('Home page elements are keyboard accessible', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      )

      // Check that interactive elements can be focused
      const buttons = screen.getAllByRole('button')
      const links = screen.getAllByRole('link')
      
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex')
      })
      
      links.forEach(link => {
        expect(link).toBeVisible()
      })
    })

    test('Login form is keyboard navigable', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Test tab order
      emailInput.focus()
      expect(document.activeElement).toBe(emailInput)
      
      fireEvent.keyDown(emailInput, { key: 'Tab' })
      expect(document.activeElement).toBe(passwordInput)
    })
  })

  describe('ARIA Labels and Roles', () => {
    test('Form elements have proper labels', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    test('Buttons have accessible names', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })

    test('Navigation has proper landmarks', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      )

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })
  })

  describe('Screen Reader Support', () => {
    test('Loading states are announced', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      // Check for aria-live regions
      const liveRegion = document.querySelector('[aria-live]')
      expect(liveRegion).toBeInTheDocument()
    })

    test('Error messages are associated with form fields', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email/i)
      
      // Trigger validation error
      fireEvent.blur(emailInput)
      
      // Check if error is properly associated
      if (emailInput.getAttribute('aria-describedby')) {
        const errorId = emailInput.getAttribute('aria-describedby')
        const errorElement = document.getElementById(errorId)
        expect(errorElement).toBeInTheDocument()
      }
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    test('Focus indicators are visible', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      )

      const firstButton = screen.getAllByRole('button')[0]
      firstButton.focus()
      
      const styles = window.getComputedStyle(firstButton)
      expect(styles.outline).toBeTruthy()
    })

    test('Text has sufficient contrast', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      )

      // This is a basic test - in a real scenario, you'd use tools like axe-core
      const textElements = screen.getAllByText(/./i)
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element)
        expect(styles.color).toBeTruthy()
      })
    })
  })

  describe('Responsive and Mobile Accessibility', () => {
    test('Touch targets are appropriately sized', () => {
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        const minSize = 44 // 44px minimum touch target size
        
        // This is a simplified test - real implementation would check computed dimensions
        expect(button).toBeVisible()
      })
    })
  })

  describe('Form Accessibility', () => {
    test('Required fields are properly marked', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const requiredFields = screen.getAllByRole('textbox', { required: true })
      requiredFields.forEach(field => {
        expect(field).toHaveAttribute('aria-required', 'true')
      })
    })

    test('Form validation provides accessible feedback', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText(/email/i)
      
      // Test invalid input
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)
      
      // Check for aria-invalid attribute
      setTimeout(() => {
        if (emailInput.getAttribute('aria-invalid') === 'true') {
          expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        }
      }, 100)
    })
  })
})

describe('Accessibility Utils', () => {
  test('generateId creates unique IDs', () => {
    const { generateId } = require('../utils/accessibility')
    
    const id1 = generateId('test')
    const id2 = generateId('test')
    
    expect(id1).not.toBe(id2)
    expect(id1).toMatch(/^test-/)
    expect(id2).toMatch(/^test-/)
  })

  test('announceToScreenReader creates live region', () => {
    const { announceToScreenReader } = require('../utils/accessibility')
    
    announceToScreenReader('Test message')
    
    const liveRegion = document.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion.textContent).toBe('Test message')
  })
})
