import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch doctor stats
      const statsResponse = await fetch('/api/doctor/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      
      // Fetch patients
      const patientsResponse = await fetch('/api/doctor/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const patientsData = await patientsResponse.json();
      
      // Fetch recent diagnoses
      const diagnosesResponse = await fetch('/api/doctor/diagnoses?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const diagnosesData = await diagnosesResponse.json();
      
      if (statsData.success) setStats(statsData.stats);
      if (patientsData.success) setPatients(patientsData.patients);
      if (diagnosesData.success) setRecentDiagnoses(diagnosesData.diagnoses);
      
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.specialization} • {user?.hospital}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'patients', name: 'Patients' },
              { id: 'diagnoses', name: 'Recent Diagnoses' },
              { id: 'create-diagnosis', name: 'New Diagnosis' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Total Diagnoses</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalDiagnoses}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Total Patients</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalPatients}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">This Month</h3>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.thisMonth}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900">Average Risk</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {(stats.averageRisk * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Risk Distribution */}
            {stats && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.riskDistribution.low}</div>
                    <div className="text-sm text-gray-600">Low Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.riskDistribution.moderate}</div>
                    <div className="text-sm text-gray-600">Moderate Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.riskDistribution.high}</div>
                    <div className="text-sm text-gray-600">High Risk</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Patient List</h3>
              <p className="text-sm text-gray-600">Anonymized patient information for privacy protection</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Visits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.anonymousId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.ageGroup}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(patient.lastVisit).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.totalVisits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          patient.riskLevel < 0.3 
                            ? 'bg-green-100 text-green-800'
                            : patient.riskLevel < 0.7
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.riskLevel < 0.3 ? 'Low' : patient.riskLevel < 0.7 ? 'Moderate' : 'High'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Diagnoses Tab */}
        {activeTab === 'diagnoses' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Diagnoses</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentDiagnoses.map((diagnosis) => (
                  <div key={diagnosis.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Patient: {diagnosis.patient?.anonymousId}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {diagnosis.diagnosis || 'No diagnosis recorded'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Risk: {(diagnosis.risk * 100).toFixed(1)}% • 
                          Confidence: {(diagnosis.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(diagnosis.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                          diagnosis.risk < 0.3 
                            ? 'bg-green-100 text-green-800'
                            : diagnosis.risk < 0.7
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {diagnosis.risk < 0.3 ? 'Low Risk' : diagnosis.risk < 0.7 ? 'Moderate Risk' : 'High Risk'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Diagnosis Tab */}
        {activeTab === 'create-diagnosis' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Diagnosis</h3>
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Diagnosis Form</h3>
              <p className="text-gray-600 mb-4">
                This feature allows doctors to create comprehensive diagnoses with file uploads,
                test results, and treatment plans.
              </p>
              <button 
                onClick={() => window.location.href = '/predict?mode=doctor'}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Go to Advanced Prediction Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
