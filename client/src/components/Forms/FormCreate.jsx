// src/components/Forms/FormCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lovService, formsService } from '../../services/forms';
import Header from '../Common/Header';
import { AlertCircle, ArrowRight, FileText } from 'lucide-react';

const FormCreate = () => {
  const [ministries, setMinistries] = useState([]);
  const [selectedMinistry, setSelectedMinistry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadMinistries();
  }, []);

  const loadMinistries = async () => {
    try {
      const data = await lovService.getMinistries();
      setMinistries(data);
      
      // Auto-select if only one ministry
      if (data.length === 1) {
        setSelectedMinistry(data[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading ministries:', error);
      setError('Failed to load ministries');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMinistry) {
      setError('Please select a ministry');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const form = await formsService.createForm({
        ministry_id: parseInt(selectedMinistry)
      });
      
      // Redirect to form builder
      navigate(`/forms/${form.id}/edit`);
    } catch (error) {
      console.error('Error creating form:', error);
      setError(error.response?.data?.message || 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-church-primary rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create New Ministry Budget Form
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Select your ministry to begin
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ministry Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ministry <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedMinistry}
                onChange={(e) => {
                  setSelectedMinistry(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                disabled={loading || ministries.length === 1}
              >
                <option value="">Select your ministry...</option>
                {ministries.map((ministry) => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.name}
                  </option>
                ))}
              </select>
              {ministries.length === 1 && (
                <p className="mt-2 text-sm text-gray-500">
                  Your ministry has been automatically selected
                </p>
              )}
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll complete 9 sections of ministry planning</li>
                <li>• Add events and budget details</li>
                <li>• Set 3-5 SMART goals for your ministry</li>
                <li>• Your form will be saved as you work</li>
                <li>• Submit when ready for pillar approval</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedMinistry || loading}
                className="px-6 py-3 bg-church-primary text-white rounded-lg hover:bg-church-secondary disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
              >
                <span>{loading ? 'Creating...' : 'Start Form'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormCreate;
