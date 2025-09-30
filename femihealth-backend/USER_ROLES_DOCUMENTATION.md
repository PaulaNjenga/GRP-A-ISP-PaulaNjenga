# FemiHealth User Roles and Data Anonymization System

## Overview

The FemiHealth application implements a comprehensive role-based access control (RBAC) system with three distinct user types, each with specific permissions and capabilities. The system prioritizes data privacy and anonymization to protect sensitive medical information while maintaining functionality for healthcare professionals.

## User Roles

### 1. Patients (Normal Users)
**Role**: `patient`

**Purpose**: Self-assessment and health monitoring

**Capabilities**:
- Perform simplified PCOS risk assessments using tabular data
- View their own prediction results and history
- Access personalized health insights and recommendations
- Manage their own profile and medical information
- Limited to basic health data input (no complex medical uploads)

**Permissions**:
- `SELF_PREDICT`: Can create self-assessment predictions
- `VIEW_OWN_RESULTS`: Can view their own prediction results

**API Access**:
- `/api/predict/tabular` - Basic risk assessment
- `/api/predict/history` - Own prediction history
- `/api/dashboard` - Personal dashboard
- `/api/dashboard/profile` - Profile management

### 2. Doctors (Medical Professionals)
**Role**: `doctor`

**Purpose**: Professional diagnosis and patient care

**Capabilities**:
- All patient capabilities plus:
- Upload and analyze medical test results
- Upload and analyze ultrasound scans and medical images
- Create comprehensive diagnoses with clinical notes
- Access anonymized patient data for diagnosis purposes
- Manage treatment plans and follow-up schedules
- View patient lists (anonymized for privacy)

**Permissions**:
- All patient permissions plus:
- `DIAGNOSE`: Can create medical diagnoses
- `UPLOAD_TESTS`: Can upload medical test results and images
- `VIEW_PATIENT_DATA`: Can access patient data for diagnosis
- `CREATE_DIAGNOSIS`: Can create formal medical diagnoses

**Requirements**:
- Must have verified license number
- Require verification status: `verified`
- Must provide specialization and hospital affiliation

**API Access**:
- All patient endpoints plus:
- `/api/doctor/patients` - View patient list (anonymized)
- `/api/doctor/diagnosis` - Create/update diagnoses
- `/api/doctor/stats` - Doctor-specific statistics
- `/api/predict/multimodal` - Advanced predictions with images

### 3. Admins (System Oversight)
**Role**: `admin`

**Purpose**: System management and oversight

**Capabilities**:
- No prediction functionality (focused on system management)
- Manage user accounts and roles
- View system health and security metrics
- Access anonymized analytics and reports
- Verify doctor credentials
- Export anonymized data for research/compliance

**Permissions**:
- `MANAGE_USERS`: Can manage user accounts and roles
- `VIEW_SYSTEM_HEALTH`: Can view system metrics and health
- `MANAGE_SECURITY`: Can manage security settings
- `VIEW_ANALYTICS`: Can access system analytics

**API Access**:
- `/api/admin/system/health` - System health monitoring
- `/api/admin/analytics` - Anonymized analytics
- `/api/admin/users/:id/role` - User role management
- `/api/admin/doctors/verification-requests` - Doctor verification
- `/api/admin/export/anonymized-data` - Data export

## Data Anonymization Implementation

### PII Protection Strategies

#### 1. Anonymous Identifiers
- Each user gets a unique anonymous ID generated from SHA-256 hash of email
- Format: `anon_` + first 12 characters of hash
- Used for all analytics and logging instead of real user IDs

#### 2. Data Masking
- **Names**: `John Doe` → `J*** D***`
- **Emails**: `john.doe@email.com` → `j***e@email.com`
- **License Numbers**: `MD123456789` → `LIC***6789`
- **Dates**: Full dates → Year-month only (`2024-03`)

#### 3. Data Categorization
Instead of exact values, data is grouped into ranges:
- **Age Groups**: `18-24`, `25-34`, `35-44`, `45-54`, `55+`
- **Height Ranges**: `under-150`, `150-159`, `160-169`, `170-179`, `180+`
- **Weight Ranges**: `under-50`, `50-59`, `60-69`, `70-79`, `80+`

### Data Access Methods

#### User Model Methods
```javascript
// Standard user data without sensitive fields
user.toJSON()

// Masked PII for API responses
user.toSafeJSON()

// Fully anonymized for analytics
user.toAnonymized()

// Public doctor information for patients
user.toDoctorProfile()
```

#### Prediction Model Methods
```javascript
// Anonymized version for analytics
prediction.toAnonymized()

// Safe version for patient view
prediction.toPatientView()

// Full version for doctors (with patient info)
prediction.toDoctorView()
```

## Security Features

### 1. Role-Based Access Control (RBAC)
- Permission-based middleware system
- Resource access control (own data vs others)
- Role verification for sensitive operations
- Doctor verification requirements

### 2. Audit Logging
- All sensitive operations are logged with anonymous user IDs
- No PII stored in logs
- Timestamp and action tracking for compliance

### 3. File Upload Security
- Medical file validation (images, documents)
- Size limits (10MB per file)
- Type validation for medical formats
- Secure file storage with access controls

### 4. API Endpoint Protection
- JWT-based authentication
- Role-based route protection
- Rate limiting (100 requests/15min)
- CORS and security headers

## Database Design Principles

### 1. PII Separation
- No personally identifiable information in analytics tables
- Separate anonymized data store for research
- Anonymous user identifiers for cross-referencing

### 2. Medical Data Protection
- Encrypted storage for sensitive medical information
- Secure file handling for medical images
- Audit trails for all medical data access

### 3. Compliance Ready
- **HIPAA-compliant** data handling procedures
- **GDPR-ready** anonymization techniques
- Data retention policies
- Right to be forgotten implementation

## API Endpoints by Role

### Patient Endpoints
```
POST /api/predict/tabular          - Basic risk assessment
GET  /api/predict/history          - Own prediction history
GET  /api/predict/result/:id       - Own prediction results
GET  /api/dashboard                - Personal dashboard
GET  /api/dashboard/profile        - Profile management
PUT  /api/dashboard/profile        - Update profile
```

### Doctor Endpoints
```
GET  /api/doctor/patients          - Patient list (anonymized)
GET  /api/doctor/patients/:id      - Patient details
POST /api/doctor/diagnosis         - Create diagnosis
PUT  /api/doctor/diagnosis/:id     - Update diagnosis
GET  /api/doctor/diagnoses         - Diagnosis history
GET  /api/doctor/stats             - Doctor statistics
POST /api/doctor/diagnosis/:id/files - Upload additional files
POST /api/predict/multimodal       - Advanced predictions
```

### Admin Endpoints
```
GET  /api/admin/system/health      - System health
GET  /api/admin/analytics          - Anonymized analytics
PUT  /api/admin/users/:id/role     - Manage user roles
GET  /api/admin/doctors/verification-requests - Doctor verification
POST /api/admin/doctors/:id/verify - Approve/reject doctors
GET  /api/admin/export/anonymized-data - Export data
```

## Implementation Examples

### Role Checking Middleware
```javascript
// Check specific permission
app.get('/api/sensitive-data', 
  enhancedAuthMiddleware,
  RBACMiddleware.requirePermission(PERMISSIONS.VIEW_PATIENT_DATA),
  handler
);

// Check specific role
app.get('/api/admin-only', 
  enhancedAuthMiddleware,
  RBACMiddleware.requireRole(USER_ROLES.ADMIN),
  handler
);

// Check resource access (own data or permission)
app.get('/api/user/:userId/data',
  enhancedAuthMiddleware,
  RBACMiddleware.requireResourceAccess(PERMISSIONS.VIEW_PATIENT_DATA, 'userId'),
  handler
);
```

### Data Anonymization Usage
```javascript
// In API responses
const users = User.getAll().map(user => user.toSafeJSON());

// For analytics
const anonymizedStats = User.getAnonymizedStats();

// For logging
console.log(`Action performed by: ${user.anonymousId}`);
```

## Compliance and Privacy

### HIPAA Compliance
- All medical data is encrypted at rest and in transit
- Access controls based on minimum necessary principle
- Audit logs for all PHI access
- Business associate agreements for third-party services

### GDPR Compliance
- Data minimization through anonymization
- Right to access, rectify, and delete personal data
- Consent management for data processing
- Data protection impact assessments

### Security Best Practices
- Regular security audits and penetration testing
- Encryption of sensitive data fields
- Secure API design with rate limiting
- Regular backup and disaster recovery procedures

## Future Enhancements

1. **Multi-Factor Authentication**: Enhanced security for all user types
2. **Advanced Analytics**: Machine learning insights from anonymized data
3. **Telemedicine Integration**: Video consultations for doctors
4. **Mobile App Support**: Native mobile applications with same RBAC
5. **Blockchain Integration**: Immutable audit trails for medical records

This comprehensive role-based system ensures that FemiHealth can serve patients, healthcare professionals, and administrators while maintaining the highest standards of data privacy and security.
