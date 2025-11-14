// src/components/Forms/sections/FormSection1.jsx
import React from 'react';

const FormSection1 = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Ministry Name (Read-only, comes from form) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ministry Leader Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.leader_name || ''}
          onChange={(e) => handleChange('leader_name', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Enter ministry leader's full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={data.contact_email || ''}
          onChange={(e) => handleChange('contact_email', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="ministry.leader@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={data.contact_phone || ''}
          onChange={(e) => handleChange('contact_phone', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="(123) 456-7890"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Active Members
        </label>
        <input
          type="number"
          value={data.active_members || ''}
          onChange={(e) => handleChange('active_members', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Enter approximate number"
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ministry Description
        </label>
        <textarea
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Briefly describe your ministry's purpose and activities..."
        />
      </div>
    </div>
  );
};

export default FormSection1;
