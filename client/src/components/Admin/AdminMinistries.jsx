// src/components/Admin/AdminMinistries.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import Header from '../Common/Header';
import { Plus, Edit2, Trash2, Building2, User, ArrowLeft, Search, AlertCircle } from 'lucide-react';

const AdminMinistries = () => {
  const navigate = useNavigate();
  const [ministries, setMinistries] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [ministryLeaders, setMinistryLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    assigned_pillars: [],
    ministry_leader_id: '',
    description: '',
    active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ministriesData, usersData] = await Promise.all([
        adminService.getMinistries(),
        adminService.getUsers()
      ]);
      setMinistries(ministriesData);
      // Filter out admins for both dropdowns - show all active users except admins
      const nonAdminUsers = usersData.filter(u => u.role !== 'admin' && u.active);
      setPillars(nonAdminUsers);
      setMinistryLeaders(nonAdminUsers);
      console.log('All users:', usersData.map(u => ({ id: u.id, name: u.full_name, role: u.role })));
      console.log('Non-admin users for dropdowns:', nonAdminUsers.map(u => ({ id: u.id, name: u.full_name, role: u.role })));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load ministries');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMinistry(null);
    setFormData({
      name: '',
      assigned_pillars: [],
      ministry_leader_id: '',
      description: '',
      active: true
    });
    setShowModal(true);
  };

  const handleEdit = (ministry) => {
    setEditingMinistry(ministry);
    setFormData({
      name: ministry.name,
      assigned_pillars: ministry.assigned_pillars || [],
      ministry_leader_id: ministry.ministry_leader_id || '',
      description: ministry.description || '',
      active: ministry.active
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminService.deleteMinistry(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting ministry:', error);
      alert(error.response?.data?.message || 'Failed to delete ministry. It may be in use by existing forms.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Clean up the data before sending
      const dataToSend = {
        ...formData,
        // Filter out empty pillar selections and convert to integers
        assigned_pillars: formData.assigned_pillars
          .filter(id => id !== '' && id !== null)
          .map(id => parseInt(id)),
        // Convert ministry_leader_id to integer or null
        ministry_leader_id: formData.ministry_leader_id 
          ? parseInt(formData.ministry_leader_id) 
          : null
      };

      console.log('Submitting ministry data:', dataToSend);

      if (editingMinistry) {
        await adminService.updateMinistry(editingMinistry.id, dataToSend);
      } else {
        await adminService.createMinistry(dataToSend);
      }
      await loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving ministry:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to save ministry');
    }
  };

  const filteredMinistries = ministries.filter(ministry =>
    ministry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ministry.pillar_name && ministry.pillar_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPillarName = (pillarId) => {
    const pillar = pillars.find(p => p.id === pillarId);
    return pillar ? pillar.full_name : 'Not assigned';
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'ministry_leader': 'Ministry Leader',
      'pillar': 'Pillar Leader',
      'pastor': 'Pastor',
      'admin': 'Administrator'
    };
    return roleLabels[role] || role;
  };

  const addPillarField = () => {
    setFormData({ ...formData, assigned_pillars: [...formData.assigned_pillars, ''] });
  };

  const removePillarField = (index) => {
    const newPillars = formData.assigned_pillars.filter((_, i) => i !== index);
    setFormData({ ...formData, assigned_pillars: newPillars });
  };

  const updatePillarField = (index, value) => {
    const newPillars = [...formData.assigned_pillars];
    newPillars[index] = parseInt(value) || '';
    setFormData({ ...formData, assigned_pillars: newPillars });
  };

  const getAvailablePillars = (currentIndex) => {
    // Filter out already selected pillars (except the current one)
    const selectedIds = formData.assigned_pillars
      .filter((id, idx) => idx !== currentIndex && id !== '')
      .map(id => parseInt(id));
    return pillars.filter(p => !selectedIds.includes(p.id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ministries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Ministries</h1>
              <p className="text-gray-500 mt-1">
                Add, edit, and assign pillars and leaders to ministries
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Ministry</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ministries or leaders..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Total Ministries</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{ministries.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Active Ministries</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {ministries.filter(m => m.active).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">With Assigned Pillars</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {ministries.filter(m => m.assigned_pillars && m.assigned_pillars.length > 0).length}
            </div>
          </div>
        </div>

        {/* Ministries List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredMinistries.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchTerm ? 'No ministries found matching your search' : 'No ministries yet'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAdd}
                  className="mt-4 px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary"
                >
                  Add Your First Ministry
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ministry Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Pillars
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ministry Leader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMinistries.map((ministry) => (
                    <tr key={ministry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-church-primary rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="font-medium text-gray-900">{ministry.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          {ministry.assigned_pillar_details && ministry.assigned_pillar_details.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ministry.assigned_pillar_details.map((pillar, idx) => (
                                <span key={pillar.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {pillar.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className={ministry.ministry_leader_id ? 'text-gray-900' : 'text-gray-400'}>
                            {ministry.ministry_leader_name || 'Not assigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {ministry.description || 'No description'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-2 py-1 text-xs font-medium rounded-full
                          ${ministry.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'}
                        `}>
                          {ministry.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(ministry)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg inline-flex items-center"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ministry.id, ministry.name)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {editingMinistry ? 'Edit Ministry' : 'Add New Ministry'}
                </h3>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ministry Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      placeholder="e.g., Women on the Rise"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Pillars
                    </label>
                    <div className="space-y-3">
                      {formData.assigned_pillars.length === 0 ? (
                        <div className="text-sm text-gray-500 italic mb-2">
                          No pillars assigned yet
                        </div>
                      ) : (
                        formData.assigned_pillars.map((pillarId, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <select
                              value={pillarId}
                              onChange={(e) => updatePillarField(index, e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                            >
                              <option value="">Select Pillar</option>
                              {getAvailablePillars(index).map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.full_name} ({getRoleLabel(user.role)})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removePillarField(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Remove pillar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                      <button
                        type="button"
                        onClick={addPillarField}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Assign more pillars</span>
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Forms from this ministry will be routed to these pillars for approval
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ministry Leader
                    </label>
                    <select
                      value={formData.ministry_leader_id}
                      onChange={(e) => setFormData({ ...formData, ministry_leader_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                    >
                      <option value="">Select Ministry Leader (Optional)</option>
                      {ministryLeaders.map((leader) => (
                        <option key={leader.id} value={leader.id}>
                          {leader.full_name} ({getRoleLabel(leader.role)})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Assign a ministry leader to this ministry
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      placeholder="Brief description of this ministry..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-church-primary border-gray-300 rounded focus:ring-church-primary"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Active (ministry can submit forms)
                    </label>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setError('');
                      }}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium"
                    >
                      {editingMinistry ? 'Update Ministry' : 'Add Ministry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMinistries;
