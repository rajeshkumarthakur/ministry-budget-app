// src/components/Forms/sections/FormSection2.jsx
import React from 'react';

const FormSection2 = ({ data, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mission Statement <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.mission || ''}
          onChange={(e) => handleChange('mission', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="What is the primary purpose of your ministry? What do you aim to accomplish?"
        />
        <p className="mt-1 text-sm text-gray-500">
          Describe the core purpose and focus of your ministry
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vision Statement <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.vision || ''}
          onChange={(e) => handleChange('vision', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Where do you see your ministry in the next 1-3 years?"
        />
        <p className="mt-1 text-sm text-gray-500">
          Describe your ministry's future direction and aspirations
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Core Values
        </label>
        <textarea
          value={data.values || ''}
          onChange={(e) => handleChange('values', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="What principles guide your ministry's work?"
        />
        <p className="mt-1 text-sm text-gray-500">
          List 3-5 core values that guide your ministry
        </p>
      </div>
    </div>
  );
};

export default FormSection2;
