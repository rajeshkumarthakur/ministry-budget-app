// src/components/Admin/AdminEventTypes.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin';
import Header from '../Common/Header';
import { Plus, Edit2, Trash2, Calendar, ArrowLeft, Search, AlertCircle } from 'lucide-react';

const AdminEventTypes = () => {
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    active: true
  });

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEventTypes();
      setEventTypes(data);
    } catch (error) {
      console.error('Error loading event types:', error);
      setError('Failed to load event types');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingType(null);
    setFormData({
      name: '',
      active: true
    });
    setShowModal(true);
  };

  const handleEdit = (eventType) => {
    setEditingType(eventType);
    setFormData({
      name: eventType.name,
      active: eventType.active
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminService.deleteEventType(id);
      await loadEventTypes();
    } catch (error) {
      console.error('Error deleting event type:', error);
      alert(error.response?.data?.message || 'Failed to delete event type. It may be in use by existing events.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingType) {
        await adminService.updateEventType(editingType.id, formData);
      } else {
        await adminService.createEventType(formData);
      }
      await loadEventTypes();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving event type:', error);
      setError(error.response?.data?.message || 'Failed to save event type');
    }
  };

  const filteredEventTypes = eventTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event types...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Manage Event Types</h1>
              <p className="text-gray-500 mt-1">
                Add and manage categories for ministry events
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Event Type</span>
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
              placeholder="Search event types..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Total Event Types</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{eventTypes.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Active Types</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {eventTypes.filter(t => t.active).length}
            </div>
          </div>
        </div>

        {/* Event Types Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {filteredEventTypes.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchTerm ? 'No event types found matching your search' : 'No event types yet'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAdd}
                  className="mt-4 px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary"
                >
                  Add Your First Event Type
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEventTypes.map((eventType) => (
                <div
                  key={eventType.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{eventType.name}</h3>
                        <span className={`
                          text-xs px-2 py-1 rounded-full mt-1 inline-block
                          ${eventType.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'}
                        `}>
                          {eventType.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                    <button
                      onClick={() => handleEdit(eventType)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(eventType.id, eventType.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Common Event Types Suggestions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Common Event Type Suggestions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
            <div>• Worship Service</div>
            <div>• Conference</div>
            <div>• Workshop</div>
            <div>• Fellowship Event</div>
            <div>• Outreach Event</div>
            <div>• Training Session</div>
            <div>• Leadership Meeting</div>
            <div>• Fundraiser</div>
            <div>• Prayer Service</div>
            <div>• Community Service</div>
            <div>• Bible Study</div>
            <div>• Youth Event</div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {editingType ? 'Edit Event Type' : 'Add New Event Type'}
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
                      Event Type Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      placeholder="e.g., Worship Service"
                      required
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
                      Active (available for selection in forms)
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
                      {editingType ? 'Update Event Type' : 'Add Event Type'}
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

export default AdminEventTypes;
