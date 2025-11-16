// src/components/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import Header from '../Common/Header';
import { 
  Users, Building2, Calendar, FileText, 
  Settings, TrendingUp, AlertCircle, CheckCircle 
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove users and assign roles',
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      borderColor: 'hover:border-blue-300',
      path: '/admin/users',
      stat: stats?.totalUsers || 0
    },
    {
      title: 'Manage Ministries',
      description: 'Configure ministries and assign pillar leaders',
      icon: Building2,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-700',
      borderColor: 'hover:border-purple-300',
      path: '/admin/ministries',
      stat: stats?.totalMinistries || 0
    },
    {
      title: 'Manage Event Types',
      description: 'Add or edit event type categories',
      icon: Calendar,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
      borderColor: 'hover:border-green-300',
      path: '/admin/event-types',
      stat: stats?.totalEventTypes || 0
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Settings,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      borderColor: 'hover:border-gray-300',
      path: '/admin/settings',
      stat: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Manage your church's ministry planning system
              </p>
            </div>
            <div className="w-16 h-16 bg-church-primary rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Forms</span>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalForms || 0}</div>
            <p className="text-sm text-gray-500 mt-1">All submitted forms</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Pending Approval</span>
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-yellow-600">{stats?.pendingForms || 0}</div>
            <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Approved Forms</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">{stats?.approvedForms || 0}</div>
            <p className="text-sm text-gray-500 mt-1">Fully approved</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Budget</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">
              ${((stats?.totalBudget || 0) / 1000).toFixed(0)}K
            </div>
            <p className="text-sm text-gray-500 mt-1">Requested this year</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`
                    bg-white rounded-lg shadow-sm p-6 text-left 
                    hover:shadow-md transition-shadow border-2 border-transparent
                    ${action.borderColor}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${action.iconBg}
                    `}>
                      <Icon className={`w-6 h-6 ${action.iconColor}`} />
                    </div>
                    {action.stat !== null && (
                      <span className="text-2xl font-bold text-gray-900">
                        {action.stat}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="divide-y">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {activity.user} • {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${activity.type === 'approval' ? 'bg-green-100 text-green-800' : ''}
                        ${activity.type === 'submission' ? 'bg-blue-100 text-blue-800' : ''}
                        ${activity.type === 'rejection' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {activity.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Health */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900">System Status</h3>
            </div>
            <p className="text-sm text-gray-600">All systems operational</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Users className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Active Users</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Active Ministries</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.activeMinistries || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
