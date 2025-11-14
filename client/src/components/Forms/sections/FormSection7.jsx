// src/components/Forms/sections/FormSection7.jsx
import React, { useState, useEffect } from 'react';
import { formsService } from '../../../services/forms';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

const FormSection7 = ({ formId, data, onChange, formData }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [formId]);

  const loadEvents = async () => {
    try {
      const data = await formsService.getEvents(formId);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const getEventsBudget = () => {
    return events.reduce((sum, event) => sum + parseFloat(event.budget_amount || 0), 0);
  };

  const getOperatingBudget = () => {
    return parseFloat(data.operating_budget || 0);
  };

  const getCapitalExpenses = () => {
    return parseFloat(data.capital_expenses || 0);
  };

  const getTotalBudget = () => {
    return getEventsBudget() + getOperatingBudget() + getCapitalExpenses();
  };

  if (loading) {
    return <div className="text-center py-8">Loading budget information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Events Budget</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">
            ${getEventsBudget().toLocaleString()}
          </div>
          <p className="text-xs text-blue-700 mt-1">From {events.length} event(s)</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Operating Budget</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900">
            ${getOperatingBudget().toLocaleString()}
          </div>
          <p className="text-xs text-green-700 mt-1">Annual operations</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Capital Expenses</span>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">
            ${getCapitalExpenses().toLocaleString()}
          </div>
          <p className="text-xs text-purple-700 mt-1">One-time purchases</p>
        </div>
      </div>

      {/* Total Budget */}
      <div className="bg-gradient-to-r from-church-primary to-church-secondary rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Total Ministry Budget Request</h3>
            <p className="text-sm opacity-90">For this planning period</p>
          </div>
          <div className="text-4xl font-bold">
            ${getTotalBudget().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Budget Input Fields */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Operating Budget <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={data.operating_budget || ''}
              onChange={(e) => handleChange('operating_budget', e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Regular operating expenses (supplies, utilities, maintenance, etc.)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capital Expenses
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={data.capital_expenses || ''}
              onChange={(e) => handleChange('capital_expenses', e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            One-time purchases (equipment, furniture, major renovations)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Breakdown & Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.budget_justification || ''}
            onChange={(e) => handleChange('budget_justification', e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
            placeholder="Provide a detailed breakdown of your budget and justify each major expense category..."
          />
          <p className="mt-1 text-sm text-gray-500">
            Explain how you arrived at these numbers and why each expense is necessary
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Funding Sources
          </label>
          <textarea
            value={data.funding_sources || ''}
            onChange={(e) => handleChange('funding_sources', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
            placeholder="List any external funding sources, grants, donations, or fundraising plans..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Previous Year Comparison (if applicable)
          </label>
          <textarea
            value={data.previous_year_comparison || ''}
            onChange={(e) => handleChange('previous_year_comparison', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-primary focus:border-transparent"
            placeholder="How does this budget compare to last year? Explain any significant changes..."
          />
        </div>
      </div>

      {/* Events Budget Breakdown */}
      {events.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Events Budget Details</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{event.event_name}</span>
                  <span className="font-medium text-gray-900">
                    ${parseFloat(event.budget_amount).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex items-center justify-between font-semibold">
                <span className="text-gray-900">Total Events:</span>
                <span className="text-gray-900">${getEventsBudget().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSection7;
