// src/components/Forms/sections/FormSection9.jsx
import React from 'react';

const FormSection9 = ({ data, onChange }) => {
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
          Success Stories & Testimonials
        </label>
        <textarea
          value={data.success_stories || ''}
          onChange={(e) => handleChange('success_stories', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Share recent success stories, testimonials, or positive impacts from your ministry..."
        />
        <p className="mt-1 text-sm text-gray-500">
          Highlight lives changed, goals achieved, or meaningful moments
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Communication Plan
        </label>
        <textarea
          value={data.communication_plan || ''}
          onChange={(e) => handleChange('communication_plan', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="How do you communicate with ministry members? (email, social media, announcements, etc.)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Volunteer Management
        </label>
        <textarea
          value={data.volunteer_management || ''}
          onChange={(e) => handleChange('volunteer_management', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Describe your volunteer structure, roles, and how you recruit and retain volunteers..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Evaluation & Metrics
        </label>
        <textarea
          value={data.evaluation_metrics || ''}
          onChange={(e) => handleChange('evaluation_metrics', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="How do you measure the effectiveness of your ministry? What key metrics do you track?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Long-Term Vision (3-5 Years)
        </label>
        <textarea
          value={data.long_term_vision || ''}
          onChange={(e) => handleChange('long_term_vision', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Where do you see your ministry in 3-5 years? What is your long-term vision?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments or Information
        </label>
        <textarea
          value={data.additional_comments || ''}
          onChange={(e) => handleChange('additional_comments', e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
          placeholder="Any other information you'd like to share that hasn't been covered in previous sections..."
        />
      </div>

      {/* Submission Confirmation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Ready to Submit?</h4>
        <p className="text-sm text-blue-800">
          Please review all sections carefully before submitting. Once submitted, you will not be able to edit the form. 
          Your form will be routed for approval according to the established workflow.
        </p>
      </div>
    </div>
  );
};

export default FormSection9;
