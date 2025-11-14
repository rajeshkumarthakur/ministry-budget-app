// src/components/Forms/sections/FormSection5.jsx
import React, { useState, useEffect } from 'react';
import { formsService } from '../../../services/forms';
import { Plus, Edit2, Trash2, Target, AlertCircle } from 'lucide-react';

const FormSection5 = ({ formId, data, onChange }) => {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    goal_description: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    time_bound: ''
  });

  const MAX_GOALS = 5;
  const MIN_GOALS = 3;

  useEffect(() => {
    loadGoals();
  }, [formId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await formsService.getGoals(formId);
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (goals.length >= MAX_GOALS) {
      alert(`Maximum ${MAX_GOALS} goals allowed`);
      return;
    }

    setEditingGoal(null);
    setFormData({
      goal_description: '',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      time_bound: ''
    });
    setShowModal(true);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      goal_description: goal.goal_description || '',
      specific: goal.specific || '',
      measurable: goal.measurable || '',
      achievable: goal.achievable || '',
      relevant: goal.relevant || '',
      time_bound: goal.time_bound || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (goalId) => {
    if (goals.length <= MIN_GOALS) {
      if (!window.confirm(`You need at least ${MIN_GOALS} goals. Are you sure you want to delete this goal? You'll need to add another one.`)) {
        return;
      }
    } else if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await formsService.deleteGoal(formId, goalId);
      await loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingGoal) {
        await formsService.updateGoal(formId, editingGoal.id, formData);
      } else {
        await formsService.createGoal(formId, formData);
      }
      await loadGoals();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading goals...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SMART Goals</h3>
          <p className="text-sm text-gray-500 mt-1">
            Define {MIN_GOALS}-{MAX_GOALS} SMART goals for your ministry this year
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={goals.length >= MAX_GOALS}
          className="px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal ({goals.length}/{MAX_GOALS})</span>
        </button>
      </div>

      {/* Goals Requirement Alert */}
      {goals.length < MIN_GOALS && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Minimum Goals Required
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              You need at least {MIN_GOALS} goals. You currently have {goals.length}.
              Please add {MIN_GOALS - goals.length} more goal{MIN_GOALS - goals.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      {/* SMART Goals Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">What are SMART Goals?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>S</strong>pecific - Clear and well-defined</li>
          <li><strong>M</strong>easurable - Quantifiable with metrics</li>
          <li><strong>A</strong>chievable - Realistic and attainable</li>
          <li><strong>R</strong>elevant - Aligned with ministry mission</li>
          <li><strong>T</strong>ime-bound - Has a specific deadline</li>
        </ul>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No goals added yet</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary"
          >
            Add Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, index) => (
            <div
              key={goal.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
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
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.goal_description}
                    onChange={(e) => setFormData({ ...formData, goal_description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                    placeholder="e.g., Increase youth group attendance"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-semibold text-church-primary">S</span>pecific <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.specific}
                    onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                    placeholder="What exactly do you want to accomplish? Be specific and clear."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-semibold text-church-primary">M</span>easurable <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.measurable}
                    onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                    placeholder="How will you measure success? What metrics will you use?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-semibold text-church-primary">A</span>chievable <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.achievable}
                    onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                    placeholder="Is this goal realistic with available resources? How will you achieve it?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-semibold text-church-primary">R</span>elevant <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.relevant}
                    onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                    placeholder="Why is this goal important? How does it align with your ministry's mission?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="font-semibold text-church-primary">T</span>ime-bound <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.time_bound}
                    onChange={(e) => setFormData({ ...formData, time_bound: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
                    placeholder="When will you achieve this goal? Set a specific deadline or timeframe."
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-church-primary text-white rounded-lg hover:bg-church-secondary font-medium"
                  >
                    {editingGoal ? 'Update Goal' : 'Add Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSection5;
