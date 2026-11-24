import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const LocalityAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/central/analytics');
      setAnalytics(data);
    } catch (err) {
      console.warn('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryData = Object.entries(analytics?.category_distribution || {}).map(([key, value]) => ({
    name: key,
    count: value,
  }));

  const priorityData = Object.entries(analytics?.priority_distribution || {}).map(([key, value]) => ({
    name: key,
    value: value,
  }));

  const PRIORITY_COLORS = {
    P1: '#EF4444',
    P2: '#F59E0B',
    P3: '#3B82F6',
    P4: '#10B981',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Locality Analytics & AI Strategic Insights
          </h1>
          <p className="text-xs text-slate-500">
            Data-driven intelligence computed by Agent 8 (Locality Analytics and Insights Agent)
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Complaint Distribution by Infrastructure Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Priority SLA Breakdown (P1 Critical to P4 Routine)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recurring Hotspots & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotspots */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Recurring Infrastructure Hotspots</span>
          </div>
          <div className="space-y-2">
            {(analytics?.recurring_hotspots || []).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400 text-center">
                No recurring hotspots detected. All infrastructure operating within baseline parameters.
              </div>
            ) : (
              (analytics?.recurring_hotspots || []).map((hotspot, i) => (
                <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-slate-700 dark:text-slate-300">
                  {hotspot}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Agent 8 AI Maintenance Recommendations</span>
          </div>
          <div className="space-y-2">
            {(analytics?.ai_recommendations || []).map((rec, i) => (
              <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-300">
                {rec}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
