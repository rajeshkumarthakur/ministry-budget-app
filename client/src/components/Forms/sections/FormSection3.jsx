// src/components/Forms/sections/FormSection3.jsx
import React from 'react';

const FormSection3 = ({ data, onChange }) => {
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
          Current Programs & Activities <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.current_programs || ''}
          onChange={(e) => handleChange('current_programs', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="List and describe your ministry's regular programs, activities, and services..."
        />
        <p className="mt-1 text-sm text-gray-500">
          Include weekly meetings, monthly events, ongoing projects, etc.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Audience
        </label>
        <textarea
          value={data.target_audience || ''}
          onChange={(e) => handleChange('target_audience', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Who does your ministry primarily serve? (e.g., youth, families, seniors, community)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Proposed New Programs (If Any)
        </label>
        <textarea
          value={data.proposed_programs || ''}
          onChange={(e) => handleChange('proposed_programs', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Describe any new programs or activities you plan to start this year..."
        />
        <p className="mt-1 text-sm text-gray-500">
          Include purpose, frequency, and expected impact
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Meeting Schedule
        </label>
        <input
          type="text"
          value={data.meeting_schedule || ''}
          onChange={(e) => handleChange('meeting_schedule', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="e.g., Every Sunday at 10 AM, First Friday of each month"
        />
      </div>
    </div>
  );
};

export default FormSection3;
