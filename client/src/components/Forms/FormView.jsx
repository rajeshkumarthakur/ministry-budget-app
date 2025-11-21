// src/components/Forms/FormView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formsService } from '../../services/forms';
import { useAuth } from '../../context/AuthContext';
import Header from '../Common/Header';
import { AlertCircle, Calendar, DollarSign, Users, Target, ArrowLeft, FileText, CheckCircle, Clock, XCircle, ThumbsUp, ThumbsDown, MessageCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import FormExport from './FormExport';

const FormView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [form, setForm] = useState(null);
  const [events, setEvents] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalComments, setApprovalComments] = useState('');
  const [approving, setApproving] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryDescription, setQueryDescription] = useState('');
  const [querying, setQuerying] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revoking, setRevoking] = useState(false);

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
      if (error.response?.status === 401) {
        // Token expired - logout and let ProtectedRoute redirect to login
        logout();
      } else {
        setError('Failed to load form');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'gray', icon: FileText, text: 'Draft' },
      pending_pillar: { color: 'yellow', icon: Clock, text: 'Pending Pillar Approval' },
      pending_pastor: { color: 'blue', icon: Clock, text: 'Pending Pastor Approval' },
      approved: { color: 'green', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'red', icon: AlertCircle, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${config.color}-100 text-${config.color}-800`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.text}
      </span>
    );
  };

  const getTotalBudget = () => {
    const eventsBudget = events.reduce((sum, event) => sum + parseFloat(event.budget_amount || 0), 0);
    const operating = parseFloat(form?.sections?.section7?.operating_budget || 0);
    const capital = parseFloat(form?.sections?.section7?.capital_expenses || 0);
    return eventsBudget + operating + capital;
  };

  const canApprove = () => {
    if (!user || !form) return false;
    // Pillar can approve if form is pending pillar and they haven't made a decision yet
    if (user.role === 'pillar' && form.status === 'pending_pillar') {
      // Don't show approve buttons if decision already made (form moved forward or rejected)
      return true;
    }
    return false;
  };

  const canQuery = () => {
    if (!user || !form) return false;
    // Pastor can act on forms that are pending pastor approval OR already approved/rejected
    // But not if they've already made a decision (moved to approved or rejected)
    if (user.role === 'pastor') {
      // Can only act if form is pending_pastor (hasn't made decision yet)
      if (form.status === 'pending_pastor') {
        return true;
      }
    }
    return false;
  };

  const canRevoke = () => {
    if (!user || !form) return false;
    
    // Don't show revoke button if approve/reject buttons are visible
    if (canApprove() || canQuery()) {
      return false;
    }
    
    // Admin can revoke any form (except draft, and not when approve/query buttons are shown)
    if (user.role === 'admin' && form.status !== 'draft') {
      return true;
    }
    
    // Pillar can revoke forms they've already acted on (not pending_pillar, not draft)
    if (user.role === 'pillar') {
      if (form.status !== 'draft' && form.status !== 'pending_pillar') {
        return true;
      }
    }
    
    // Pastor can revoke forms they've already acted on (not pending_pastor, not pending_pillar, not draft)
    if (user.role === 'pastor') {
      if (form.status !== 'draft' && form.status !== 'pending_pillar' && form.status !== 'pending_pastor') {
        return true;
      }
    }
    
    return false;
  };

  const handleApprovalClick = (action) => {
    setApprovalAction(action);
    setApprovalComments('');
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    try {
      setApproving(true);
      await formsService.approveForm(id, approvalAction, approvalComments);
      setShowApprovalModal(false);
      // Reload form data
      await loadFormData();
      alert(`Form ${approvalAction}d successfully!`);
    } catch (error) {
      console.error('Error approving form:', error);
      alert(error.response?.data?.error || `Failed to ${approvalAction} form`);
    } finally {
      setApproving(false);
    }
  };

  const handleQueryClick = () => {
    setQueryDescription('');
    setShowQueryModal(true);
  };

  const handleRevokeClick = () => {
    setShowRevokeModal(true);
  };

  const handleRevokeConfirm = async () => {
    try {
      setRevoking(true);
      await formsService.revokeDecision(id);
      setShowRevokeModal(false);
      // Reload form data
      await loadFormData();
      alert('Decision revoked successfully. Form reset to pending pillar approval.');
    } catch (error) {
      console.error('Error revoking decision:', error);
      alert(error.response?.data?.error || 'Failed to revoke decision');
    } finally {
      setRevoking(false);
    }
  };

  const handleQuerySubmit = async () => {
    if (!queryDescription.trim()) {
      alert('Please enter a query description');
      return;
    }

    try {
      setQuerying(true);
      const result = await formsService.raiseQuery(id, queryDescription);
      setShowQueryModal(false);
      // Reload form data
      await loadFormData();
      const message = result.revoked 
        ? `Query sent successfully to ${result.notifiedPillars} pillar(s). Form has been revoked and reset to pending pillar approval.`
        : `Query sent successfully to ${result.notifiedPillars} pillar(s).`;
      alert(message);
    } catch (error) {
      console.error('Error raising query:', error);
      alert(error.response?.data?.error || 'Failed to raise query');
    } finally {
      setQuerying(false);
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
                Ministry Budget & Planning Form
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Form #{form.form_number} • {form.ministry_name}
              </p>
            </div>
            {getStatusBadge(form.status)}
          </div>

          {form.submitted_at && (
            <p className="text-sm text-gray-500 mt-2">
              Submitted on {new Date(form.submitted_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Approval Section - Only show if user can approve */}
        {canApprove() && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {user.role === 'pillar' ? 'Pillar Approval Required' : 'Pastor Approval Required'}
                </h3>
                <p className="text-sm text-gray-600">
                  This form is awaiting your review and approval
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprovalClick('reject')}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-md"
                >
                  <ThumbsDown className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprovalClick('approve')}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-md"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Query Section - Only show for pastor */}
        {canQuery() && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Pastor Actions
                </h3>
                <p className="text-sm text-gray-600">
                  Review this form and take action: approve, reject, or raise a query.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprovalClick('reject')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-md"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprovalClick('approve')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-md"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept
                </button>
                <button
                  onClick={handleQueryClick}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-md"
                >
                  <MessageCircle className="w-5 h-5" />
                  Raise Query
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revoke Section - Show after pillar/pastor has made a decision */}
        {canRevoke() && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Revoke Decision
                </h3>
                <p className="text-sm text-gray-600">
                  {user.role === 'pillar' 
                    ? 'You can revoke your decision and reset this form to pending pillar approval.'
                    : 'You can revoke your decision and reset this form to pending pastor approval.'}
                </p>
              </div>
              <button
                onClick={handleRevokeClick}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors shadow-md"
              >
                <RotateCcw className="w-5 h-5" />
                Revoke Decision
              </button>
            </div>
          </div>
        )}

        {/* Export Section */}
          <FormExport 
            formId={id}
            formNumber={form.form_number}
            ministryName={form.ministry_name}
            status={form.status}
          />

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

        {/* Section 1: Ministry Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ministry Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Leader Name</label>
              <p className="mt-1">{sections.section1?.leader_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Contact Email</label>
              <p className="mt-1">{sections.section1?.contact_email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Contact Phone</label>
              <p className="mt-1">{sections.section1?.contact_phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Active Members</label>
              <p className="mt-1">{sections.section1?.active_members || 'Not provided'}</p>
            </div>
            {sections.section1?.description && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1">{sections.section1.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Mission & Vision */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mission & Vision</h2>
          {sections.section2?.mission && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Mission Statement</label>
              <p className="mt-1 text-gray-600">{sections.section2.mission}</p>
            </div>
          )}
          {sections.section2?.vision && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Vision Statement</label>
              <p className="mt-1 text-gray-600">{sections.section2.vision}</p>
            </div>
          )}
          {sections.section2?.values && (
            <div>
              <label className="text-sm font-medium text-gray-700">Core Values</label>
              <p className="mt-1 text-gray-600">{sections.section2.values}</p>
            </div>
          )}
        </div>

        {/* Section 3: Programs & Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Programs & Activities</h2>
          {sections.section3?.current_programs && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Current Programs</label>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap">{sections.section3.current_programs}</p>
            </div>
          )}
          {sections.section3?.proposed_programs && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Proposed New Programs</label>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap">{sections.section3.proposed_programs}</p>
            </div>
          )}
        </div>

        {/* Section 4: Events */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ministry Events ({events.length})</h2>
          {events.length === 0 ? (
            <p className="text-gray-500">No events added</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {event.event_type}
                    </span>
                    <h4 className="font-semibold text-gray-900">{event.event_name}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {event.expected_attendance} attendees
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      ${parseFloat(event.budget_amount).toLocaleString()}
                    </div>
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Goals */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">SMART Goals ({goals.length})</h2>
          {goals.length === 0 ? (
            <p className="text-gray-500">No goals added</p>
          ) : (
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-church-primary text-white rounded-full font-semibold text-sm">
                      {index + 1}
                    </span>
                    <h4 className="font-semibold text-gray-900">{goal.goal_description}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Specific:</span>
                      <p className="text-gray-600 mt-1">{goal.specific}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Measurable:</span>
                      <p className="text-gray-600 mt-1">{goal.measurable}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Achievable:</span>
                      <p className="text-gray-600 mt-1">{goal.achievable}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Relevant:</span>
                      <p className="text-gray-600 mt-1">{goal.relevant}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Time-bound:</span>
                      <p className="text-gray-600 mt-1">{goal.time_bound}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 7: Budget Summary */}
        {sections.section7 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Budget Summary</h2>
            {sections.section7.budget_justification && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Budget Justification</label>
                <p className="mt-1 text-gray-600 whitespace-pre-wrap">{sections.section7.budget_justification}</p>
              </div>
            )}
          </div>
        )}

        {/* Section 8: Challenges & Opportunities */}
        {sections.section8 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Challenges & Opportunities</h2>
            {sections.section8.challenges && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Current Challenges</label>
                <p className="mt-1 text-gray-600 whitespace-pre-wrap">{sections.section8.challenges}</p>
              </div>
            )}
            {sections.section8.opportunities && (
              <div>
                <label className="text-sm font-medium text-gray-700">Growth Opportunities</label>
                <p className="mt-1 text-gray-600 whitespace-pre-wrap">{sections.section8.opportunities}</p>
              </div>
            )}
          </div>
        )}

        {/* Approval History */}
        {(form.pillar_approved_at || form.pastor_approved_at || form.rejected_at) && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Approval History</h2>
            <div className="space-y-3">
              {form.pillar_approved_at && (
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span>Pillar Approved on {new Date(form.pillar_approved_at).toLocaleDateString()}</span>
                </div>
              )}
              {form.pastor_approved_at && (
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span>Pastor Approved on {new Date(form.pastor_approved_at).toLocaleDateString()}</span>
                </div>
              )}
              {form.rejected_at && (
                <div>
                  <div className="flex items-center text-sm text-red-600 mb-2">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>Rejected on {new Date(form.rejected_at).toLocaleDateString()}</span>
                  </div>
                  {form.rejection_reason && (
                    <p className="text-sm text-gray-600 ml-7">Reason: {form.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {approvalAction === 'approve' ? 'Approve Form' : 'Reject Form'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {approvalAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                  placeholder={approvalAction === 'approve' ? 'Optional comments...' : 'Please provide a reason for rejection...'}
                  required={approvalAction === 'reject'}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={approving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalSubmit}
                  disabled={approving || (approvalAction === 'reject' && !approvalComments.trim())}
                  className={`px-6 py-2 text-white rounded-lg font-medium ${
                    approvalAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {approving ? 'Processing...' : `Confirm ${approvalAction === 'approve' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Query Modal */}
        {showQueryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Raise Query
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={queryDescription}
                  onChange={(e) => setQueryDescription(e.target.value)}
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe your query or concern about this form..."
                  required
                  autoFocus
                />
              </div>

              {(form?.status === 'pending_pastor' || form?.status === 'approved' || form?.status === 'rejected') && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-orange-800">
                    <strong>Note:</strong> This query will automatically revoke the current decision and reset the form to pending pillar approval.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowQueryModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={querying}
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuerySubmit}
                  disabled={querying || !queryDescription.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {querying ? 'Sending...' : 'Send Query'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revoke Modal */}
        {showRevokeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Revoke Decision
              </h3>
              
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to revoke your decision for this form?
              </p>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 text-center">
                  {user.role === 'pillar' 
                    ? 'This will reset the form to pending pillar approval and notify pillar users.'
                    : 'This will reset the form to pending pastor approval.'}
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={revoking}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevokeConfirm}
                  disabled={revoking}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {revoking ? 'Revoking...' : 'Confirm Revoke'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormView;

