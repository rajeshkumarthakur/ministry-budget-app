// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formsService } from '../../services/forms';
import Header from '../Common/Header';
import { FileText, Clock, CheckCircle, XCircle, Plus, Settings } from 'lucide-react';

const StatsCard = ({ icon: Icon, label, value, color }) => (
  <div className="card">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const badges = {
    draft: { label: 'Draft', className: 'badge-draft', icon: FileText },
    pending_pillar: { label: 'Pending Pillar', className: 'badge-pending', icon: Clock },
    pending_pastor: { label: 'Pending Pastor', className: 'badge-pending', icon: Clock },
    approved: { label: 'Approved', className: 'badge-approved', icon: CheckCircle },
    rejected: { label: 'Rejected', className: 'badge-rejected', icon: XCircle },
  };

  const badge = badges[status] || badges.draft;
  const Icon = badge.icon;

  return (
    <span className={`badge ${badge.className}`}>
      <Icon size={14} /> {badge.label}
    </span>
  );
};

const Dashboard = () => {
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending_total: 0,
    approved: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();

    // Reload data when page becomes visible (e.g., after approving/rejecting in another tab or returning to this page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadData = async () => {
    try {
      const [formsData, statsData] = await Promise.all([
        formsService.getForms(),
        formsService.getDashboardStats(),
      ]);
      setForms(formsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = (form) => {
    // Admin can edit any form at any time
    if (user.role === 'admin') return true;
    
    // Ministry leader can only edit forms from ministries they lead
    if (user.role === 'ministry_leader') {
      return form.ministry_leader_id === user.id;
    }
    
    // Pillar can only edit forms from ministries they're assigned to
    if (user.role === 'pillar') {
      // Check if pillar is assigned to this ministry
      if (form.assigned_pillars && Array.isArray(form.assigned_pillars) && form.assigned_pillars.length > 0) {
        return form.assigned_pillars.includes(user.id);
      }
      // If no assigned pillars for the ministry, don't allow editing
      return false;
    }
    
    // Pastor can edit any form at any time
    if (user.role === 'pastor') return true;
    
    return false;
  };

  const needsMyApproval = (form) => {
    if (user.role === 'pillar' && form.status === 'pending_pillar') return true;
    if (user.role === 'pastor' && form.status === 'pending_pastor') return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Ministry Budget & Plan Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.name}!
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Only show "New Form" button for ministry_leader and admin roles */}
          {(user.role === 'ministry_leader' || user.role === 'admin') && (
            <button
              onClick={() => navigate('/forms/create')}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} /> New Form
            </button>
          )}
          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-gray-100 text-gray-800 hover:text-gray-900 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2 transition-colors"
            >
              <Settings size={20} />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - Different layouts for different roles */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${
        user.role === 'pillar' 
          ? 'lg:grid-cols-4' 
          : user.role === 'pastor'
          ? 'lg:grid-cols-4 max-w-5xl mx-auto'
          : user.role === 'ministry_leader'
          ? 'lg:grid-cols-4'
          : 'lg:grid-cols-3 max-w-4xl mx-auto'
      }`}>
        <StatsCard
          icon={FileText}
          label="Total Forms"
          value={stats.total}
          color="bg-blue-500"
        />
        
        {/* Drafts - Only for ministry_leader and admin */}
        {(user.role === 'ministry_leader' || user.role === 'admin') && (
          <StatsCard
            icon={FileText}
            label="Drafts"
            value={stats.draft}
            color="bg-gray-500"
          />
        )}
        
        {/* Pending Approval - For pillar (exclusive to pillar approval) */}
        {user.role === 'pillar' && (
          <StatsCard
            icon={Clock}
            label="Pending Approval"
            value={stats.pending_pillar || 0}
            color="bg-yellow-500"
          />
        )}
        
        {/* Pending Approval - For pastor (pending pastor approval) */}
        {user.role === 'pastor' && (
          <StatsCard
            icon={Clock}
            label="Pending Approval"
            value={stats.pending_pastor || 0}
            color="bg-yellow-500"
          />
        )}
        
        <StatsCard
          icon={CheckCircle}
          label="Approved"
          value={stats.approved}
          color="bg-green-600"
        />
        
        {/* Rejected - For pillar, pastor, and ministry_leader */}
        {(user.role === 'pillar' || user.role === 'pastor' || user.role === 'ministry_leader') && (
          <StatsCard
            icon={XCircle}
            label="Rejected"
            value={stats.rejected || 0}
            color="bg-red-600"
          />
        )}
      </div>

      {/* Forms Table */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Forms</h2>

        {forms.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No forms found</p>
            {/* Only show "Create New Form" button for ministry_leader and admin roles - hidden for pillar and pastor */}
            {(user.role === 'ministry_leader' || user.role === 'admin') && (
              <button
                onClick={() => navigate('/forms/create')}
                className="px-6 py-3 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create New Form</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Form #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ministry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Leader
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forms.map((form) => (
                  <tr
                    key={form.id}
                    className={needsMyApproval(form) ? 'bg-yellow-50' : ''}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {form.form_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {form.ministry_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {form.leader_name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={form.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(form.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/forms/${form.id}/view`)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          View
                        </button>
                        {canEdit(form) && (
                          <button
                            onClick={() => navigate(`/forms/${form.id}/edit`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                        )}
                        {needsMyApproval(form) && (
                          <button
                            onClick={() => navigate(`/forms/${form.id}/approve`)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
