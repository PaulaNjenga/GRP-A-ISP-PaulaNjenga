import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { predictionAPI, exportAPI } from '../services/api'
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Download, 
  Share2, 
  Calendar,
  TrendingUp,
  Eye,
  FileText
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const Results = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [exporting, setExporting] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    fetchResult()
  }, [id])

  const fetchResult = async () => {
    try {
      if (!id) {
        setError('No prediction ID provided')
        return
      }
      const response = await predictionAPI.getResult(id)
      setResult(response.data.data)
    } catch (err) {
      console.error('Results data error:', err)
      setError('Failed to load prediction results')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (probability) => {
    if (probability < 0.3) return { level: 'Low', color: 'success', bgColor: 'bg-success-50', textColor: 'text-success-800' }
    if (probability < 0.7) return { level: 'Moderate', color: 'warning', bgColor: 'bg-warning-50', textColor: 'text-warning-800' }
    return { level: 'High', color: 'danger', bgColor: 'bg-danger-50', textColor: 'text-danger-800' }
  }

  const getRiskIcon = (level) => {
    switch (level) {
      case 'Low': return <CheckCircle className="h-6 w-6 text-success-600" />
      case 'Moderate': return <AlertTriangle className="h-6 w-6 text-warning-600" />
      case 'High': return <AlertTriangle className="h-6 w-6 text-danger-600" />
      default: return <Info className="h-6 w-6 text-gray-600" />
    }
  }

  const generateHeatmap = () => {
    if (!result?.heatmapData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const imageData = result.heatmapData

    // Create a new image element
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw the original image
      ctx.drawImage(img, 0, 0)
      
      // Apply heatmap overlay
      ctx.globalAlpha = 0.6
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      
      // Draw heatmap regions (mock data for demonstration)
      if (result.heatmapRegions) {
        result.heatmapRegions.forEach(region => {
          ctx.fillRect(region.x, region.y, region.width, region.height)
        })
      }
      
      ctx.globalAlpha = 1.0
    }
    img.src = imageData
  }

  useEffect(() => {
    if (showHeatmap && result?.heatmapData) {
      generateHeatmap()
    }
  }, [showHeatmap, result])

  const handleExport = async (format) => {
    setExporting(true)
    try {
      const response = await exportAPI.exportPDF(id, { format })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pcos-prediction-${id}.${format}`
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

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-danger-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The prediction results could not be loaded.'}</p>
          <Link to="/predict" className="btn-primary">
            Take New Assessment
          </Link>
        </div>
      </div>
    )
  }

  const risk = getRiskLevel(result.probability)

  // Chart data for risk factors
  const riskFactorsData = {
    labels: result.riskFactors?.map(factor => factor.name) || [],
    datasets: [{
      label: 'Risk Contribution (%)',
      data: result.riskFactors?.map(factor => factor.contribution) || [],
      backgroundColor: [
        'rgba(236, 72, 153, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderColor: [
        'rgba(236, 72, 153, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(139, 92, 246, 1)',
      ],
      borderWidth: 2
    }]
  }

  // Doughnut chart for overall risk
  const riskChartData = {
    labels: ['PCOS Risk', 'No Risk'],
    datasets: [{
      data: [result.probability * 100, (1 - result.probability) * 100],
      backgroundColor: [
        risk.color === 'success' ? '#10b981' : risk.color === 'warning' ? '#f59e0b' : '#ef4444',
        '#e5e7eb'
      ],
      borderWidth: 0
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Heart className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Your PCOS Risk Assessment Results
          </h1>
          <p className="text-gray-600">
            Generated on {new Date(result.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Main Risk Card */}
        <div className={`card mb-8 ${risk.bgColor} border-l-4 border-l-${risk.color}-500`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {getRiskIcon(risk.level)}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {risk.level} Risk
                </h2>
                <p className={`text-lg ${risk.textColor}`}>
                  {(result.probability * 100).toFixed(1)}% probability of PCOS
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="w-32 h-32">
                <Doughnut data={riskChartData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${risk.color === 'success' ? 'bg-success-100' : risk.color === 'warning' ? 'bg-warning-100' : 'bg-danger-100'}`}>
            <h3 className="font-semibold mb-2">What this means:</h3>
            {risk.level === 'Low' && (
              <p className="text-sm">
                Your assessment indicates a low risk of PCOS. Continue maintaining healthy lifestyle habits 
                and regular check-ups with your healthcare provider.
              </p>
            )}
            {risk.level === 'Moderate' && (
              <p className="text-sm">
                Your assessment indicates a moderate risk of PCOS. Consider discussing these results with 
                your healthcare provider for further evaluation and potential lifestyle modifications.
              </p>
            )}
            {risk.level === 'High' && (
              <p className="text-sm">
                Your assessment indicates a high risk of PCOS. We strongly recommend consulting with a 
                healthcare provider for proper diagnosis and treatment planning.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Risk Factors Analysis */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Key Risk Factors
            </h3>
            
            {result.riskFactors && result.riskFactors.length > 0 ? (
              <div className="h-64">
                <Bar 
                  data={riskFactorsData} 
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%'
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="mx-auto h-12 w-12 mb-4" />
                <p>Risk factor analysis not available</p>
              </div>
            )}
          </div>

          {/* Image Analysis */}
          {result.imageAnalysis && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Ultrasound Analysis
                </h3>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="btn-outline text-sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showHeatmap ? 'Hide' : 'Show'} Heatmap
                </button>
              </div>

              {showHeatmap ? (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-64 object-contain border border-gray-200 rounded-lg"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Red areas indicate regions of interest identified by the AI model
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.imageAnalysis.findings?.map((finding, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        finding.severity === 'high' ? 'bg-danger-500' : 
                        finding.severity === 'medium' ? 'bg-warning-500' : 'bg-success-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{finding.feature}</p>
                        <p className="text-sm text-gray-600">{finding.description}</p>
                        <p className="text-xs text-gray-500">Confidence: {finding.confidence}%</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No specific findings detected</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Personalized Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Lifestyle Modifications</h4>
              <ul className="space-y-2">
                {result.recommendations?.lifestyle?.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                )) || [
                  'Maintain a balanced diet rich in whole foods',
                  'Engage in regular physical activity (150 min/week)',
                  'Manage stress through relaxation techniques',
                  'Maintain a healthy sleep schedule'
                ].map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Medical Follow-up</h4>
              <ul className="space-y-2">
                {result.recommendations?.medical?.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                )) || [
                  'Schedule consultation with gynecologist',
                  'Consider hormone level testing',
                  'Monitor menstrual cycle patterns',
                  'Regular health screenings'
                ].map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="btn-primary"
          >
            {exporting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Report
          </button>

          <button
            onClick={() => navigator.share?.({ 
              title: 'PCOS Risk Assessment Results',
              text: `My PCOS risk assessment shows ${risk.level.toLowerCase()} risk (${(result.probability * 100).toFixed(1)}%)`,
              url: window.location.href
            })}
            className="btn-outline"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Results
          </button>

          <Link to="/dashboard" className="btn-outline">
            <FileText className="h-4 w-4 mr-2" />
            View History
          </Link>

          <Link to="/predict" className="btn-secondary">
            Take New Assessment
          </Link>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Medical Disclaimer</p>
              <p>
                These results are generated by AI and are for informational purposes only. 
                They should not replace professional medical advice, diagnosis, or treatment. 
                Always consult with qualified healthcare providers regarding your health concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results
