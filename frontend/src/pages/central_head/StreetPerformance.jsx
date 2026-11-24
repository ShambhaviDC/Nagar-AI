import React, { useState, useEffect } from 'react';
import { Users, Award, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const StreetPerformance = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/central/street-performance');
      setPerformance(data);
    } catch (err) {
      console.warn('Failed to load performance scorecard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const ratingColors = {
    Excellent: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    Good: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    'Needs Improvement': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    'Critical Attention': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Street Head Accountability Scorecard
          </h1>
          <p className="text-xs text-slate-500">
            Factual performance evaluation based on SLA compliance rate, resolution speed, and overdue counts
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {performance.map((st, i) => (
          <div
            key={st.street_id || i}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Street Corridor</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{st.street_name}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ratingColors[st.performance_rating] || ratingColors.Good}`}>
                {st.performance_rating}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400">
              Street Head: <strong className="text-slate-900 dark:text-white">{st.street_head_name}</strong>
            </div>

            {/* SLA Compliance Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">SLA Compliance</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{st.sla_compliance_rate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    st.sla_compliance_rate >= 80 ? 'bg-emerald-500' : st.sla_compliance_rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, st.sla_compliance_rate))}%` }}
                ></div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Pending</span>
                <span className="font-extrabold text-sm text-blue-600">{st.pending_complaints}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Overdue</span>
                <span className="font-extrabold text-sm text-red-600">{st.overdue_complaints}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Avg Hours</span>
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{st.avg_resolution_hours}h</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
