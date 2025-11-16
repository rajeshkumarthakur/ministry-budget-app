// src/components/Forms/FormApproval.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formsService } from '../../services/forms';
import Header from '../Common/Header';
import { AlertCircle, CheckCircle, XCircle, ArrowLeft, FileText } from 'lucide-react';

const FormApproval = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [events, setEvents] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalComments, setApprovalComments] = useState('');

  useEffect(() => {
    loadFormData();
  }, [id]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const [formData, eventsData, goalsData] = await Promise.all([
        formsService.getForm(id),
        formsService.getEvents(id),
        formsService.getGoals(id)
      ]);
      setForm(formData);
      setEvents(eventsData);
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading form:', error);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this form?')) {
      return;
    }

    try {
      setSubmitting(true);
      await formsService.approveForm(id, { comments: approvalComments });
      alert('Form approved successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error approving form:', error);
      setError(error.response?.data?.message || 'Failed to approve form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      await formsService.rejectForm(id, { reason: rejectionReason });
      alert('Form rejected. Ministry leader will be notified.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error rejecting form:', error);
      setError(error.response?.data?.message || 'Failed to reject form');
    } finally {
      setSubmitting(false);
      setShowRejectModal(false);
    }
  };

  const getTotalBudget = () => {
    const eventsBudget = events.reduce((sum, event) => sum + parseFloat(event.budget_amount || 0), 0);
    const operating = parseFloat(form?.sections?.section7?.operating_budget || 0);
    const capital = parseFloat(form?.sections?.section7?.capital_expenses || 0);
    return eventsBudget + operating + capital;
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

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Form not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const sections = form.sections || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Review & Approve Form
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Form #{form.form_number} • {form.ministry_name}
              </p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Pending Your Approval
            </span>
          </div>

          {form.submitted_at && (
            <p className="text-sm text-gray-500 mt-2">
              Submitted on {new Date(form.submitted_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Budget Summary */}
        <div className="bg-gradient-to-r from-church-primary to-church-secondary rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Total Budget Request</h3>
              <p className="text-sm opacity-90">{events.length} events, {goals.length} goals</p>
            </div>
            <div className="text-4xl font-bold">
              ${getTotalBudget().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm font-medium text-gray-700">Events</div>
            <div className="text-2xl font-bold text-gray-900">{events.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm font-medium text-gray-700">Goals</div>
            <div className="text-2xl font-bold text-gray-900">{goals.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm font-medium text-gray-700">Active Members</div>
            <div className="text-2xl font-bold text-gray-900">{sections.section1?.active_members || 'N/A'}</div>
          </div>
        </div>

        {/* Form Content - Condensed View */}
        <div className="space-y-6 mb-6">
          {/* Ministry Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Ministry Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Leader:</span>
                <span className="ml-2 font-medium">{sections.section1?.leader_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Contact:</span>
                <span className="ml-2 font-medium">{sections.section1?.contact_email}</span>
              </div>
            </div>
          </div>

          {/* Mission & Vision */}
          {sections.section2?.mission && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Mission Statement</h3>
              <p className="text-gray-600 text-sm">{sections.section2.mission}</p>
            </div>
          )}

          {/* Events Summary */}
          {events.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Events Summary</h3>
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <span className="font-medium">{event.event_name}</span>
                      <span className="text-gray-500 ml-2">({event.event_type})</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      ${parseFloat(event.budget_amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals Summary */}
          {goals.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Goals Summary</h3>
              <div className="space-y-2">
                {goals.map((goal, index) => (
                  <div key={goal.id} className="flex items-start text-sm">
                    <span className="flex-shrink-0 w-6 h-6 bg-church-primary text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-gray-700">{goal.goal_description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Full Form Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Need to see more details?
            </p>
            <button
              onClick={() => window.open(`/forms/${id}/view`, '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>View Full Form</span>
            </button>
          </div>
        </div>

        {/* Approval Comments */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Approval Comments (Optional)
          </label>
          <textarea
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
            placeholder="Add any comments or notes about this approval..."
          />
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={submitting}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              <span>Reject Form</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={submitting}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{submitting ? 'Processing...' : 'Approve Form'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Form</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this form. The ministry leader will see this feedback.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              placeholder="Explain why this form is being rejected and what needs to be changed..."
              required
            />

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || submitting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormApproval;
