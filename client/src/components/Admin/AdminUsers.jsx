// src/components/Admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import Header from '../Common/Header';
import { 
  Plus, Edit2, Trash2, User, Key, Shield, ArrowLeft, 
  Search, AlertCircle, Eye, EyeOff 
} from 'lucide-react';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'ministry',
    pin: '',
    active: true
  });

  const [pinFormData, setPinFormData] = useState({
    new_pin: '',
    confirm_pin: ''
  });

  const roles = [
    { value: 'ministry', label: 'Ministry Leader', color: 'blue' },
    { value: 'pillar', label: 'Pillar Leader', color: 'purple' },
    { value: 'pastor', label: 'Pastor', color: 'green' },
    { value: 'admin', label: 'Administrator', color: 'red' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      role: 'ministry',
      pin: '',
      active: true
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      pin: '', // Don't show existing PIN
      active: user.active
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminService.deleteUser(id);
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user. They may have associated data.');
    }
  };

  const handleChangePIN = (user) => {
    setEditingUser(user);
    setPinFormData({
      new_pin: '',
      confirm_pin: ''
    });
    setShowPinModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate PIN if provided
    if (formData.pin && formData.pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    try {
      if (editingUser) {
        // Don't send PIN in update unless it's changed
        const updateData = { ...formData };
        if (!updateData.pin) {
          delete updateData.pin;
        }
        await adminService.updateUser(editingUser.id, updateData);
      } else {
        // New user requires PIN
        if (!formData.pin) {
          setError('PIN is required for new users');
          return;
        }
        await adminService.createUser(formData);
      }
      await loadUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handlePINSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pinFormData.new_pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pinFormData.new_pin !== pinFormData.confirm_pin) {
      setError('PINs do not match');
      return;
    }

    try {
      await adminService.updateUserPIN(editingUser.id, { pin: pinFormData.new_pin });
      setShowPinModal(false);
      alert('PIN updated successfully');
    } catch (error) {
      console.error('Error updating PIN:', error);
      setError(error.response?.data?.message || 'Failed to update PIN');
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig ? roleConfig.color : 'gray';
  };

  const getRoleLabel = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig ? roleConfig.label : role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
              <p className="text-gray-500 mt-1">
                Add users, assign roles, and manage access
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add User</span>
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
              placeholder="Search users by name, email, or role..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-xs font-medium text-gray-600">Total Users</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{users.length}</div>
          </div>
          {roles.map(role => (
            <div key={role.value} className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-xs font-medium text-gray-600">{role.label}s</div>
              <div className={`text-2xl font-bold text-${role.color}-600 mt-1`}>
                {users.filter(u => u.role === role.value).length}
              </div>
            </div>
          ))}
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchTerm ? 'No users found matching your search' : 'No users yet'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAdd}
                  className="mt-4 px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary"
                >
                  Add Your First User
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="font-medium text-gray-900">{user.full_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-3 py-1 text-xs font-medium rounded-full
                          bg-${getRoleBadgeColor(user.role)}-100 
                          text-${getRoleBadgeColor(user.role)}-800
                        `}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`
                          px-2 py-1 text-xs font-medium rounded-full
                          ${user.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'}
                        `}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleChangePIN(user)}
                          className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded-lg inline-flex items-center"
                          title="Change PIN"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg inline-flex items-center"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.full_name)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg inline-flex items-center"
                          title="Delete"
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

        {/* Role Descriptions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Role Descriptions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-900">Ministry Leader:</span>
              <span className="text-blue-800 ml-2">Can create and submit budget forms</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Pillar Leader:</span>
              <span className="text-blue-800 ml-2">Reviews and approves ministry forms</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Pastor:</span>
              <span className="text-blue-800 ml-2">Final approval authority for all forms</span>
            </div>
            <div>
              <span className="font-medium text-blue-900">Administrator:</span>
              <span className="text-blue-800 ml-2">Full system access and management</span>
            </div>
          </div>
        </div>

        {/* User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 overflow-y-auto flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {editingUser ? 'Edit User' : 'Add New User'}
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

                <form id="user-form" onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      required
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      4-Digit PIN {!editingUser && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                        placeholder={editingUser ? "Leave blank to keep current PIN" : "Enter 4-digit PIN"}
                        maxLength="4"
                        pattern="\d{4}"
                        required={!editingUser}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {editingUser ? "Enter new PIN only if you want to change it" : "User will use this PIN to login"}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-church-primary border-gray-300 rounded focus:ring-church-primary"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Active (user can login)
                    </label>
                  </div>

                  {/* Fixed footer with buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setError('');
                      }}
                      className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium transition-colors"
                    >
                      {editingUser ? 'Update User' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* PIN Change Modal */}
        {showPinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full flex flex-col">
              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Change PIN for {editingUser?.full_name}
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

                <form id="pin-form" onSubmit={handlePINSubmit} className="space-y-4 flex flex-col">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New 4-Digit PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={pinFormData.new_pin}
                      onChange={(e) => setPinFormData({ ...pinFormData, new_pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      placeholder="Enter new PIN"
                      maxLength="4"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm PIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={pinFormData.confirm_pin}
                      onChange={(e) => setPinFormData({ ...pinFormData, confirm_pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      placeholder="Confirm new PIN"
                      maxLength="4"
                      required
                    />
                  </div>
                  {/* Fixed footer with buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPinModal(false);
                        setError('');
                      }}
                      className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium transition-colors"
                    >
                      Update PIN
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

export default AdminUsers;
