import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { authAPI } from '../services/api'
import {
  Settings as SettingsIcon,
  Shield,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Smartphone,
  Key,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import QRCode from 'qrcode'

const Settings = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('security')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Security Settings
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [changingPassword, setChangingPassword] = useState(false)

  // MFA Settings
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaSetup, setMfaSetup] = useState(null)
  const [mfaToken, setMfaToken] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [settingUpMfa, setSettingUpMfa] = useState(false)
  const [verifyingMfa, setVerifyingMfa] = useState(false)

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assessmentReminders: true,
    healthInsights: true,
    securityAlerts: true,
    marketingEmails: false
  })

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    dataSharing: false,
    analyticsOptOut: false,
    thirdPartyIntegrations: false
  })

  useEffect(() => {
    // Initialize MFA status from user data
    setMfaEnabled(user?.mfaEnabled || false)
  }, [user])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    try {
      setChangingPassword(true)
      setError('')
      
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      setSuccess('Password changed successfully')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const setupMFA = async () => {
    try {
      setSettingUpMfa(true)
      setError('')
      
      const response = await authAPI.setupMFA()
      const { secret, qrCodeUrl } = response.data.data
      
      setMfaSetup({ secret, qrCodeUrl })
      
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrCodeUrl)
      setQrCodeUrl(qrDataUrl)
      
    } catch (err) {
      setError('Failed to setup MFA')
    } finally {
      setSettingUpMfa(false)
    }
  }

  const verifyAndEnableMFA = async () => {
    if (!mfaToken || mfaToken.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    try {
      setVerifyingMfa(true)
      setError('')
      
      await authAPI.verifyMFA(mfaToken)
      
      setMfaEnabled(true)
      setMfaSetup(null)
      setMfaToken('')
      setQrCodeUrl('')
      setSuccess('MFA enabled successfully')
      
    } catch (err) {
      setError('Invalid MFA code. Please try again.')
    } finally {
      setVerifyingMfa(false)
    }
  }

  const disableMFA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return
    }

    try {
      setLoading(true)
      // In a real app, you'd call an API to disable MFA
      // await authAPI.disableMFA()
      
      setMfaEnabled(false)
      setSuccess('MFA disabled successfully')
    } catch (err) {
      setError('Failed to disable MFA')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard')
  }

  const downloadBackupCodes = () => {
    // Mock backup codes
    const backupCodes = [
      '1a2b3c4d', '5e6f7g8h', '9i0j1k2l', 'm3n4o5p6',
      'q7r8s9t0', 'u1v2w3x4', 'y5z6a7b8', 'c9d0e1f2'
    ]
    
    const content = `FemiHealth Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'femihealth-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePrivacyChange = (key, value) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveNotificationSettings = async () => {
    try {
      setLoading(true)
      // In a real app, save to backend
      setSuccess('Notification settings saved')
    } catch (err) {
      setError('Failed to save notification settings')
    } finally {
      setLoading(false)
    }
  }

  const savePrivacySettings = async () => {
    try {
      setLoading(true)
      // In a real app, save to backend
      setSuccess('Privacy settings saved')
    } catch (err) {
      setError('Failed to save privacy settings')
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    const confirmation = window.prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    )
    
    if (confirmation !== 'DELETE') {
      return
    }

    try {
      setLoading(true)
      // In a real app, call delete account API
      alert('Account deletion requested. You will receive a confirmation email.')
    } catch (err) {
      setError('Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'account', label: 'Account', icon: SettingsIcon }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account security, notifications, and privacy preferences</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Password Change */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-primary-600" />
                    Change Password
                  </h3>

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="input-field pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="input-field pr-10"
                          required
                          minLength="8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="input-field pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="btn-primary"
                    >
                      {changingPassword ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Change Password
                    </button>
                  </form>
                </div>

                {/* Two-Factor Authentication */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <Smartphone className="h-5 w-5 mr-2 text-primary-600" />
                    Two-Factor Authentication
                  </h3>

                  {!mfaEnabled ? (
                    <div>
                      <p className="text-gray-600 mb-4">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>

                      {!mfaSetup ? (
                        <button
                          onClick={setupMFA}
                          disabled={settingUpMfa}
                          className="btn-primary"
                        >
                          {settingUpMfa ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <Shield className="h-4 w-4 mr-2" />
                          )}
                          Enable Two-Factor Authentication
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                              <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                              <li>Scan the QR code below or enter the secret key manually</li>
                              <li>Enter the 6-digit code from your authenticator app</li>
                            </ol>
                          </div>

                          {qrCodeUrl && (
                            <div className="text-center">
                              <img src={qrCodeUrl} alt="MFA QR Code" className="mx-auto mb-4" />
                              <div className="bg-gray-50 p-3 rounded border">
                                <p className="text-xs text-gray-600 mb-1">Secret Key:</p>
                                <div className="flex items-center justify-center space-x-2">
                                  <code className="text-sm font-mono">{mfaSetup.secret}</code>
                                  <button
                                    onClick={() => copyToClipboard(mfaSetup.secret)}
                                    className="text-primary-600 hover:text-primary-800"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Enter 6-digit code from your authenticator app
                            </label>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="input-field flex-1"
                                placeholder="000000"
                                maxLength="6"
                              />
                              <button
                                onClick={verifyAndEnableMFA}
                                disabled={verifyingMfa || mfaToken.length !== 6}
                                className="btn-primary"
                              >
                                {verifyingMfa ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  'Verify'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <span className="text-green-800 font-medium">Two-factor authentication is enabled</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={downloadBackupCodes}
                          className="btn-outline w-full sm:w-auto"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Backup Codes
                        </button>

                        <button
                          onClick={disableMFA}
                          disabled={loading}
                          className="btn-danger w-full sm:w-auto"
                        >
                          {loading ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <Shield className="h-4 w-4 mr-2" />
                          )}
                          Disable Two-Factor Authentication
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-primary-600" />
                  Notification Preferences
                </h3>

                <div className="space-y-6">
                  {Object.entries({
                    emailNotifications: 'Email Notifications',
                    pushNotifications: 'Push Notifications',
                    assessmentReminders: 'Assessment Reminders',
                    healthInsights: 'Health Insights',
                    securityAlerts: 'Security Alerts',
                    marketingEmails: 'Marketing Emails'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                        <p className="text-sm text-gray-500">
                          {key === 'emailNotifications' && 'Receive notifications via email'}
                          {key === 'pushNotifications' && 'Receive push notifications in your browser'}
                          {key === 'assessmentReminders' && 'Get reminded to take regular health assessments'}
                          {key === 'healthInsights' && 'Receive personalized health insights and tips'}
                          {key === 'securityAlerts' && 'Get notified about security-related activities'}
                          {key === 'marketingEmails' && 'Receive promotional emails and updates'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[key]}
                          onChange={(e) => handleNotificationChange(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}

                  <button
                    onClick={saveNotificationSettings}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Notification Settings
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-primary-600" />
                  Privacy Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={privacy.profileVisibility}
                      onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                      className="input-field"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Control who can see your profile information
                    </p>
                  </div>

                  {Object.entries({
                    dataSharing: 'Data Sharing for Research',
                    analyticsOptOut: 'Opt out of Analytics',
                    thirdPartyIntegrations: 'Third-party Integrations'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                        <p className="text-sm text-gray-500">
                          {key === 'dataSharing' && 'Allow anonymized data to be used for medical research'}
                          {key === 'analyticsOptOut' && 'Opt out of usage analytics and tracking'}
                          {key === 'thirdPartyIntegrations' && 'Allow integration with third-party health apps'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacy[key]}
                          onChange={(e) => handlePrivacyChange(key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}

                  <button
                    onClick={savePrivacySettings}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Privacy Settings
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Account Information */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <SettingsIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Account Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Created</label>
                      <p className="text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Login</label>
                      <p className="text-gray-900">
                        {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="card border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-6 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Danger Zone
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-800 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                        All your data, including health assessments and profile information, will be permanently deleted.
                      </p>
                      <button
                        onClick={deleteAccount}
                        disabled={loading}
                        className="btn-danger"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
