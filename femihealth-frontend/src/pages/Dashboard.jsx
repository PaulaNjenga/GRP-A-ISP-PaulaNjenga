import React, { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { dashboardAPI, exportAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import {
  Heart,
  TrendingUp,
  Calendar,
  Download,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
  BarChart3,
  Clock,
  Target
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const Dashboard = () => {
  const { user } = useAuth()

  // Redirect based on user role
  if (user?.role === 'doctor') {
    return <Navigate to="/doctor-dashboard" replace />
  }
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState('6months')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('dashboardAPI object:', dashboardAPI)
      console.log('Available methods:', Object.keys(dashboardAPI))
      
      // Try getDashboard first, fallback to getDashboardData
      const dashboardMethod = dashboardAPI.getDashboard || dashboardAPI.getDashboardData
      if (!dashboardMethod) {
        throw new Error('No dashboard method available')
      }
      
      const response = await dashboardMethod({ timeRange })
      setDashboardData(response.data.data)
    } catch (err) {
      console.error('Dashboard data error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk) => {
    if (risk < 0.3) return 'text-success-600'
    if (risk < 0.7) return 'text-warning-600'
    return 'text-danger-600'
  }

  const getRiskBgColor = (risk) => {
    if (risk < 0.3) return 'bg-success-50 border-success-200'
    if (risk < 0.7) return 'bg-warning-50 border-warning-200'
    return 'bg-danger-50 border-danger-200'
  }

  const handleExportHistory = async () => {
    setExporting(true)
    try {
      const response = await exportAPI.exportHistory({ format: 'pdf' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pcos-history-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-danger-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Chart configurations
  const riskTrendData = {
    labels: dashboardData?.riskTrend?.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [{
      label: 'PCOS Risk Probability',
      data: dashboardData?.riskTrend?.map(item => item.risk * 100) || [],
      borderColor: 'rgb(236, 72, 153)',
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  const symptomFrequencyData = {
    labels: dashboardData?.symptomFrequency?.map(item => item.symptom) || [],
    datasets: [{
      label: 'Frequency',
      data: dashboardData?.symptomFrequency?.map(item => item.count) || [],
      backgroundColor: [
        'rgba(236, 72, 153, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ]
    }]
  }

  const riskDistributionData = {
    labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
    datasets: [{
      data: [
        dashboardData?.riskDistribution?.low || 0,
        dashboardData?.riskDistribution?.moderate || 0,
        dashboardData?.riskDistribution?.high || 0
      ],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
              Health Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}! Track your PCOS risk assessments and health trends.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-field text-sm"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            
            <button
              onClick={handleExportHistory}
              disabled={exporting}
              className="btn-outline text-sm"
            >
              {exporting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export History
            </button>
            
            <Link to="/pcos-prediction" className="btn-primary text-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.totalAssessments || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latest Risk</p>
                <p className={`text-2xl font-bold ${getRiskColor(dashboardData?.stats?.latestRisk || 0)}`}>
                  {((dashboardData?.stats?.latestRisk || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risk Trend</p>
                <p className={`text-2xl font-bold ${
                  dashboardData?.stats?.trendDirection === 'up' ? 'text-danger-600' :
                  dashboardData?.stats?.trendDirection === 'down' ? 'text-success-600' : 'text-gray-600'
                }`}>
                  {dashboardData?.stats?.trendDirection === 'up' ? '↗' :
                   dashboardData?.stats?.trendDirection === 'down' ? '↘' : '→'}
                  {Math.abs(dashboardData?.stats?.trendChange || 0).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Assessment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.daysSinceLastAssessment || 0}d
                </p>
                <p className="text-xs text-gray-500">ago</p>
              </div>
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Risk Trend Chart */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Trend Over Time</h3>
            {dashboardData?.riskTrend?.length > 0 ? (
              <div className="h-64">
                <Line data={riskTrendData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                  <p>No trend data available</p>
                  <p className="text-sm">Take more assessments to see trends</p>
                </div>
              </div>
            )}
          </div>

          {/* Risk Distribution */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            {dashboardData?.riskDistribution ? (
              <div className="h-64">
                <Doughnut data={riskDistributionData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                  <p>No distribution data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Symptom Frequency */}
        {dashboardData?.symptomFrequency?.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Common Symptoms Reported</h3>
            <div className="h-64">
              <Bar data={symptomFrequencyData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Recent Assessments */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Assessments</h3>
            <Link to="/pcos-prediction" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              New Assessment
            </Link>
          </div>

          {dashboardData?.recentAssessments?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.recentAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className={`p-4 rounded-lg border ${getRiskBgColor(assessment.risk)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        assessment.risk < 0.3 ? 'bg-success-100' :
                        assessment.risk < 0.7 ? 'bg-warning-100' : 'bg-danger-100'
                      }`}>
                        {assessment.risk < 0.3 ? (
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        ) : (
                          <AlertTriangle className={`h-5 w-5 ${
                            assessment.risk < 0.7 ? 'text-warning-600' : 'text-danger-600'
                          }`} />
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-900">
                          {assessment.risk < 0.3 ? 'Low' : assessment.risk < 0.7 ? 'Moderate' : 'High'} Risk Assessment
                        </p>
                        <p className="text-sm text-gray-600">
                          {(assessment.risk * 100).toFixed(1)}% probability • {new Date(assessment.date).toLocaleDateString()}
                        </p>
                        {assessment.hasImage && (
                          <span className="inline-flex items-center text-xs text-primary-600 mt-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Includes ultrasound analysis
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Link
                      to={`/results/${assessment.id}`}
                      className="btn-outline text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Assessments Yet</h4>
              <p className="text-gray-600 mb-6">
                Take your first PCOS risk assessment to start tracking your health journey.
              </p>
              <Link to="/pcos-prediction" className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Take Assessment
              </Link>
            </div>
          )}
        </div>

        {/* Health Insights */}
        {dashboardData?.insights?.length > 0 && (
          <div className="card mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Health Insights</h3>
            <div className="space-y-4">
              {dashboardData.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">{insight.title}</p>
                    <p className="text-sm text-blue-800 mt-1">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medical Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Health Tracking Disclaimer</p>
              <p>
                This dashboard provides trend analysis based on your assessment history. 
                The data is for informational purposes and should not replace regular medical consultations 
                or professional healthcare advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
