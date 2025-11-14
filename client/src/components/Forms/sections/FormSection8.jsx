// src/components/Forms/sections/FormSection8.jsx
import React from 'react';

const FormSection8 = ({ data, onChange }) => {
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
          Current Challenges <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.challenges || ''}
          onChange={(e) => handleChange('challenges', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="What challenges is your ministry currently facing? (e.g., volunteer recruitment, budget constraints, facility limitations)"
        />
        <p className="mt-1 text-sm text-gray-500">
          Be honest about obstacles - this helps leadership provide better support
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Proposed Solutions
        </label>
        <textarea
          value={data.solutions || ''}
          onChange={(e) => handleChange('solutions', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="What solutions or strategies do you propose to address these challenges?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Growth Opportunities <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.opportunities || ''}
          onChange={(e) => handleChange('opportunities', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="What opportunities do you see for ministry growth and expansion?"
        />
        <p className="mt-1 text-sm text-gray-500">
          Think about potential partnerships, new programs, or untapped areas of impact
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Support Needed from Church Leadership
        </label>
        <textarea
          value={data.support_needed || ''}
          onChange={(e) => handleChange('support_needed', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="What specific support, guidance, or resources do you need from church leadership?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Collaboration Opportunities
        </label>
        <textarea
          value={data.collaboration || ''}
          onChange={(e) => handleChange('collaboration', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Are there opportunities to collaborate with other ministries or external organizations?"
        />
      </div>
    </div>
  );
};

export default FormSection8;
