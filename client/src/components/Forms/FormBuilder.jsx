// src/components/Forms/FormBuilder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formsService } from '../../services/forms';
import { AlertCircle, CheckCircle, Save, Send, ArrowLeft, ArrowRight } from 'lucide-react';
import FormSection1 from './sections/FormSection1';
import FormSection2 from './sections/FormSection2';
import FormSection3 from './sections/FormSection3';
import FormSection4 from './sections/FormSection4';
import FormSection5 from './sections/FormSection5';
import FormSection6 from './sections/FormSection6';
import FormSection7 from './sections/FormSection7';
import FormSection8 from './sections/FormSection8';
import FormSection9 from './sections/FormSection9';

const SECTIONS = [
  { id: 1, title: 'Ministry Information', key: 'section1' },
  { id: 2, title: 'Mission & Vision', key: 'section2' },
  { id: 3, title: 'Programs & Activities', key: 'section3' },
  { id: 4, title: 'Events', key: 'events' },
  { id: 5, title: 'Goals', key: 'goals' },
  { id: 6, title: 'Resources Needed', key: 'section6' },
  { id: 7, title: 'Budget Summary', key: 'section7' },
  { id: 8, title: 'Challenges & Opportunities', key: 'section8' },
  { id: 9, title: 'Additional Information', key: 'section9' }
];

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [currentSection, setCurrentSection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await formsService.getForm(id);
      setForm(data);
      setFormData(data.sections || {});
    } catch (error) {
      console.error('Error loading form:', error);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionDataChange = (sectionKey, data) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: data
    }));
    // Auto-save after 2 seconds of no changes
    clearTimeout(window.formAutoSaveTimeout);
    window.formAutoSaveTimeout = setTimeout(() => {
      handleSave(true);
    }, 2000);
  };

  const handleSave = async (silent = false) => {
    try {
      if (!silent) setSaving(true);
      await formsService.updateForm(id, { sections: formData });
      if (!silent) {
        setSuccess('Form saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error saving form:', error);
      if (!silent) setError('Failed to save form');
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit this form for approval? You will not be able to edit it after submission.')) {
      return;
    }

    try {
      setSaving(true);
      await formsService.submitForm(id);
      setSuccess('Form submitted successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.response?.data?.message || 'Failed to submit form');
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentSection < SECTIONS.length) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getCompletionPercentage = () => {
    const totalSections = SECTIONS.length;
    let completed = 0;
    
    SECTIONS.forEach(section => {
      if (formData[section.key] && Object.keys(formData[section.key]).length > 0) {
        completed++;
      }
    });
    
    return Math.round((completed / totalSections) * 100);
  };

  const renderCurrentSection = () => {
    const props = {
      formId: id,
      data: formData[SECTIONS[currentSection - 1].key] || {},
      onChange: (data) => handleSectionDataChange(SECTIONS[currentSection - 1].key, data)
    };

    switch (currentSection) {
      case 1: return <FormSection1 {...props} />;
      case 2: return <FormSection2 {...props} />;
      case 3: return <FormSection3 {...props} />;
      case 4: return <FormSection4 {...props} />;
      case 5: return <FormSection5 {...props} />;
      case 6: return <FormSection6 {...props} />;
      case 7: return <FormSection7 {...props} formData={formData} />;
      case 8: return <FormSection8 {...props} />;
      case 9: return <FormSection9 {...props} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Form not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ministry Budget & Planning Form
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Form #{form.form_number} • {form.ministry_name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-church-primary">
                {completionPercentage}%
              </div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
              <div
                style={{ width: `${completionPercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-church-primary transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex overflow-x-auto space-x-2 pb-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(section.id)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${currentSection === section.id
                    ? 'bg-church-primary text-white'
                    : formData[section.key] && Object.keys(formData[section.key]).length > 0
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <span className="mr-2">{section.id}.</span>
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Current Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {SECTIONS[currentSection - 1].title}
          </h2>
          {renderCurrentSection()}
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentSection === 1}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            {currentSection === SECTIONS.length ? (
              <button
                onClick={handleSubmit}
                disabled={saving || completionPercentage < 80}
                className="px-6 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Approval</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
