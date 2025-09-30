# FemiHealth Frontend

A responsive, accessible React frontend for the FemiHealth PCOS Risk Prediction System. This application provides users with AI-powered PCOS risk assessment tools, educational content, and comprehensive health tracking features.

## 🌟 Features

### Core Functionality
- **AI-Powered Risk Assessment**: Multi-modal PCOS risk prediction using tabular data and ultrasound images
- **User Authentication**: Secure login/registration with Multi-Factor Authentication (MFA)
- **Health Dashboard**: Track prediction history, trends, and health insights with interactive charts
- **Educational Content**: Comprehensive PCOS information and management strategies
- **Results Visualization**: Risk analysis with heatmaps, charts, and personalized recommendations

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: WCAG 2.1 compliant with screen reader support, keyboard navigation, and high contrast mode
- **Role-Based Access Control**: Admin dashboard for user and system management
- **Data Export**: PDF/CSV export functionality for reports and history
- **Real-time Charts**: Interactive visualizations using Chart.js
- **Image Analysis**: Drag-and-drop ultrasound image upload with AI-powered analysis

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `localhost:5000`

### Installation

1. **Clone and install dependencies:**
```bash
cd femihealth-frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Access the application:**
Open [http://localhost:5173](http://localhost:5173) in your browser

## 🏗️ Project Structure

```
src/
├── components/
│   ├── forms/
│   │   └── ImageUpload.jsx          # Drag-and-drop image upload
│   ├── layout/
│   │   ├── Footer.jsx               # App footer with links
│   │   └── Navbar.jsx               # Responsive navigation
│   └── ui/
│       ├── AccessibilityProvider.jsx # Accessibility context and settings
│       └── LoadingSpinner.jsx       # Reusable loading component
├── contexts/
│   └── AuthContext.jsx              # Authentication state management
├── hooks/
│   └── useAuth.js                   # Authentication hook
├── pages/
│   ├── auth/
│   │   ├── Login.jsx                # Login with MFA support
│   │   ├── MFASetup.jsx             # Google Authenticator setup
│   │   └── Register.jsx             # User registration
│   ├── AdminDashboard.jsx           # Admin panel with user management
│   ├── Dashboard.jsx                # User health dashboard
│   ├── Education.jsx                # PCOS educational content
│   ├── Home.jsx                     # Landing page
│   ├── PredictionForm.jsx           # Multi-step assessment form
│   └── Results.jsx                  # Risk analysis and recommendations
├── services/
│   └── api.js                       # API service layer
├── tests/
│   └── accessibility.test.js        # Accessibility test suite
├── utils/
│   └── accessibility.js             # Accessibility utilities
├── App.jsx                          # Main app component with routing
├── index.css                        # Global styles with accessibility enhancements
└── main.jsx                         # React entry point
```

## 🎨 Design System

### Color Palette
- **Primary**: Soft pink tones (#ec4899, #f472b6)
- **Secondary**: Gentle blue tones (#3b82f6, #60a5fa)
- **Success**: #10b981
- **Warning**: #f59e0b
- **Danger**: #ef4444

### Typography
- **Headings**: Poppins font family
- **Body**: Inter font family
- **Responsive**: Mobile-first with fluid typography

### Components
- **Buttons**: Primary, outline, and secondary variants
- **Cards**: Consistent spacing and shadows
- **Forms**: Accessible inputs with validation states
- **Charts**: Interactive visualizations with Chart.js

## 🔐 Authentication Flow

1. **Registration**: Multi-field form with validation
2. **MFA Setup**: Optional Google Authenticator integration
3. **Login**: Email/password with MFA verification
4. **Protected Routes**: JWT-based authentication
5. **Role-Based Access**: User and admin role separation

## 📊 Dashboard Features

### User Dashboard
- **Health Statistics**: Total assessments, latest risk, trends
- **Interactive Charts**: Risk trends, symptom frequency, distribution
- **Assessment History**: Detailed prediction records
- **Health Insights**: Personalized recommendations

### Admin Dashboard
- **User Management**: Role assignment, status control
- **System Analytics**: User growth, prediction statistics
- **Data Export**: Bulk data export capabilities
- **System Settings**: Maintenance and configuration options

## ♿ Accessibility Features

### WCAG 2.1 Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels, live regions, semantic HTML
- **Focus Management**: Visible focus indicators, focus trapping
- **Color Contrast**: High contrast mode support
- **Reduced Motion**: Respects user motion preferences

### Accessibility Settings Panel
- High contrast mode toggle
- Reduced motion preferences
- Font size adjustment (small, normal, large, extra-large)
- Screen reader announcements

### Testing
- Comprehensive accessibility test suite
- Keyboard navigation testing
- ARIA compliance verification
- Color contrast validation

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
- **Accessibility Tests**: Keyboard navigation, ARIA compliance, screen reader support
- **Component Tests**: Form validation, user interactions
- **Integration Tests**: Authentication flow, API integration

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Features
- Mobile-first CSS approach
- Touch-friendly interface elements
- Responsive navigation with mobile menu
- Optimized image loading and display

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=FemiHealth
```

### API Integration
The frontend communicates with a Flask backend API for:
- User authentication and management
- PCOS risk predictions (tabular and multimodal)
- Dashboard data and analytics
- File uploads and exports

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deployment Options
- **Netlify**: Automatic deployment from Git
- **Vercel**: Zero-configuration deployment
- **AWS S3**: Static hosting with CloudFront
- **Docker**: Containerized deployment

## 🔒 Security Features

### Data Protection
- JWT token-based authentication
- Secure token storage in localStorage
- API request interceptors for authorization
- Input validation and sanitization

### Privacy Compliance
- Medical disclaimers on all health-related content
- Clear data usage policies
- Secure file upload handling
- No sensitive health data stored client-side

## 🎯 Performance Optimizations

### Code Splitting
- Lazy loading of route components
- Dynamic imports for large dependencies
- Optimized bundle sizes

### Image Optimization
- Responsive image loading
- Proper image formats and compression
- Lazy loading for non-critical images

### Caching Strategy
- API response caching
- Static asset caching
- Service worker implementation (future enhancement)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Ensure accessibility compliance
5. Submit a pull request

### Code Standards
- ESLint configuration for code quality
- Prettier for consistent formatting
- Accessibility-first development
- Comprehensive testing requirements

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- Component documentation in JSDoc format
- API integration examples
- Accessibility guidelines

### Troubleshooting
- Check browser console for errors
- Verify backend API connectivity
- Ensure proper environment configuration
- Review accessibility settings if needed

### Contact
For technical support or questions about the FemiHealth platform, please contact the development team.

---

**Note**: This application is for educational and informational purposes only. It should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers regarding health concerns.
