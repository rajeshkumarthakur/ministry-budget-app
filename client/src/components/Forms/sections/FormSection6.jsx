// src/components/Forms/sections/FormSection6.jsx
import React from 'react';

const FormSection6 = ({ data, onChange }) => {
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
          Personnel Needs
        </label>
        <textarea
          value={data.personnel_needs || ''}
          onChange={(e) => handleChange('personnel_needs', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Do you need additional volunteers, staff, or specific roles filled?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Equipment & Materials
        </label>
        <textarea
          value={data.equipment_needs || ''}
          onChange={(e) => handleChange('equipment_needs', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="List any equipment, supplies, or materials needed..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Facility Requirements
        </label>
        <textarea
          value={data.facility_needs || ''}
          onChange={(e) => handleChange('facility_needs', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Do you need specific rooms, spaces, or facility improvements?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technology & Software
        </label>
        <textarea
          value={data.technology_needs || ''}
          onChange={(e) => handleChange('technology_needs', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="List any technology, software, or digital tools needed..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Training & Development
        </label>
        <textarea
          value={data.training_needs || ''}
          onChange={(e) => handleChange('training_needs', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="What training or professional development is needed for your team?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Other Resources
        </label>
        <textarea
          value={data.other_needs || ''}
          onChange={(e) => handleChange('other_needs', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Any other resources, support, or needs not mentioned above..."
        />
      </div>
    </div>
  );
};

export default FormSection6;
