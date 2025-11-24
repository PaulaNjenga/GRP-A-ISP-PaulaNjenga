import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('femihealth_token')
    const tempToken = localStorage.getItem('femihealth_temp_token')
    
    // Use tempToken for MFA verification, otherwise use regular token
    if (config.url?.includes('/auth/mfa/verify') && tempToken) {
      config.headers.Authorization = `Bearer ${tempToken}`
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('femihealth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify'),
  setupMFA: () => api.post('/auth/mfa/setup'),
  verifyMFA: (token) => api.post('/auth/mfa/verify', { token }),
  resetPassword: (email) => api.post('/auth/reset-password', { email }),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// Prediction API
export const predictionAPI = {
  // PCOS Risk Assessment (41-feature model)
  predictPCOS: (data) => api.post('/prediction/pcos', data),
  
  // Check ML service health
  checkHealth: () => api.get('/prediction/health'),
  
  // Get minimal input requirements
  getMinimalInput: () => api.get('/prediction/minimal-input'),
  
  // Tabular data prediction
  predictTabular: (data) => api.post('/predict/tabular', data),
  
  // Image prediction
  predictImage: (formData) => api.post('/predict/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Multimodal prediction (combined tabular + image)
  predictMultimodal: (formData) => api.post('/predict/multimodal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Get prediction result by ID
  getResult: (id) => api.get(`/predict/result/${id}`),
  
  // Get user's prediction history
  getHistory: (page = 1, limit = 10) => api.get(`/predict/history?page=${page}&limit=${limit}`),
}

// Dashboard API
export const dashboardAPI = {
  // Get user dashboard data
  getDashboard: (params = {}) => api.get('/dashboard', { params }),
  getDashboardData: (params = {}) => api.get('/dashboard', { params }),
  
  // Get user profile
  getProfile: () => api.get('/dashboard/profile'),
  
  // Update user profile
  updateProfile: (data) => api.put('/dashboard/profile', data),
  
  // Get prediction statistics
  getStats: () => api.get('/dashboard/stats'),
  
  // Get health insights
  getInsights: () => api.get('/dashboard/insights'),
}

// Data Management API (CRUD operations)
export const dataAPI = {
  // Create new data entry
  create: (data) => api.post('/data', data),
  
  // Read data entries
  read: (id) => api.get(`/data/${id}`),
  getAll: (filters = {}) => api.get('/data', { params: filters }),
  
  // Update data entry
  update: (id, data) => api.put(`/data/${id}`, data),
  
  // Delete data entry
  delete: (id) => api.delete(`/data/${id}`),
  
  // Bulk operations
  bulkCreate: (dataArray) => api.post('/data/bulk', dataArray),
  bulkUpdate: (updates) => api.put('/data/bulk', updates),
  bulkDelete: (ids) => api.delete('/data/bulk', { data: { ids } }),
}

// Admin API (RBAC)
export const adminAPI = {
  // Get admin dashboard data
  getDashboard: () => api.get('/admin/dashboard'),
  
  // User management
  getUsers: (page = 1, limit = 20) => api.get(`/admin/users?page=${page}&limit=${limit}`),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // System statistics
  getSystemStats: () => api.get('/admin/stats'),
  
  // Predictions management
  getPredictions: (page = 1, limit = 20) => api.get(`/admin/predictions?page=${page}&limit=${limit}`),
  
  // Prediction analytics
  getPredictionAnalytics: (dateRange) => api.get('/admin/analytics/predictions', { params: dateRange }),
  
  // User activity logs
  getActivityLogs: (page = 1, limit = 50) => api.get(`/admin/logs?page=${page}&limit=${limit}`),
  
  // System health
  getSystemHealth: () => api.get('/admin/health'),
}

// Doctor API (RBAC)
export const doctorAPI = {
  // Get doctor dashboard stats
  getStats: () => api.get('/doctor/stats'),
  
  // Get doctor's patients
  getPatients: () => api.get('/doctor/patients'),
  
  // Get doctor's diagnoses
  getDiagnoses: (page = 1, limit = 10) => api.get(`/doctor/diagnoses?page=${page}&limit=${limit}`),
  
  // Get predictions for review
  getPredictionsForReview: (page = 1, limit = 20) => api.get(`/doctor/predictions?page=${page}&limit=${limit}`),
  
  // Review a prediction
  reviewPrediction: (id, reviewNotes) => api.put(`/doctor/predictions/${id}/review`, { reviewNotes }),
}

// Export/Report API
export const exportAPI = {
  // Export user report as PDF
  exportPDF: (reportId, options = {}) => api.get(`/export/pdf/${reportId}`, {
    params: options,
    responseType: 'blob'
  }),
  
  // Export data as CSV
  exportCSV: (dataType, filters = {}) => api.get(`/export/csv/${dataType}`, {
    params: filters,
    responseType: 'blob'
  }),
  
  // Export dashboard data
  exportDashboard: (format = 'pdf') => api.get(`/export/dashboard`, {
    params: { format },
    responseType: 'blob'
  }),
  
  // Export history data
  exportHistory: (options = {}) => api.get(`/export/dashboard`, {
    params: options,
    responseType: 'blob'
  }),
  
  // Generate custom report
  generateReport: (config) => api.post('/export/report', config),
  
  // Get report status
  getReportStatus: (reportId) => api.get(`/export/status/${reportId}`),
}

// Educational Content API
export const educationAPI = {
  // Get all educational articles
  getArticles: () => api.get('/education/articles'),
  
  // Get specific article
  getArticle: (id) => api.get(`/education/articles/${id}`),
  
  // Get PCOS information
  getPCOSInfo: () => api.get('/education/pcos'),
  
  // Get FAQ
  getFAQ: () => api.get('/education/faq'),
  
  // Get resources
  getResources: () => api.get('/education/resources'),
}

// File Upload API
export const fileAPI = {
  // Upload single file
  uploadFile: (file, type = 'image') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // Upload multiple files
  uploadFiles: (files, type = 'image') => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })
    formData.append('type', type)
    
    return api.post('/files/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // Delete file
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  
  // Get file info
  getFileInfo: (fileId) => api.get(`/files/${fileId}`),
}

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
  
  // Format error message
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return 'An unexpected error occurred'
  },
  
  // Check if user has permission
  hasPermission: (user, permission) => {
    if (!user || !user.permissions) return false
    return user.permissions.includes(permission) || user.role === 'admin'
  },
}

export default api
