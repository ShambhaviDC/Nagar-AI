import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Building2, Users, AlertTriangle, Clock, CheckCircle2,
  Wrench, RefreshCw, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const StreetHeadDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/street-head/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.warn('Failed to load street head dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = dashboardData?.metrics || {};
  const street = dashboardData?.street;
  const recent = dashboardData?.recent_complaints || [];
  const workers = dashboardData?.maintenance_workers || [];

  return (
    <div className="space-y-6">
      {/* Street Head Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
              <Building2 className="w-3.5 h-3.5" />
              <span>Level 2: Street Head Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
              {street?.name || 'Assigned Street'} ({street?.code || 'ST-00'})
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Command Head: <strong>{user?.name}</strong> &bull; Greenfield Locality
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/street-head/complaints"
              className="px-4 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 shadow-md transition-all flex items-center gap-2"
            >
              <span>Manage Complaints</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* SLA Alert Notice if unacknowledged or overdue exist */}
      {((metrics.new_complaints || 0) > 0 || (metrics.overdue_complaints || 0) > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Attention Required:</strong> You have {metrics.new_complaints || 0} unacknowledged complaints 
              and {metrics.overdue_complaints || 0} overdue issues approaching or exceeding SLA deadlines.
            </span>
          </div>
          <Link
            to="/street-head/complaints?tab=new"
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 whitespace-nowrap"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">New (Unacknowledged)</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {metrics.new_complaints || 0}
          </div>
          <span className="text-[10px] text-slate-400">Timer running</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Assigned / In Progress</span>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {(metrics.assigned_complaints || 0) + (metrics.in_progress_complaints || 0)}
          </div>
          <span className="text-[10px] text-slate-400">Workers deployed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Overdue (SLA Breach)</span>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-2">
            {metrics.overdue_complaints || 0}
          </div>
          <span className="text-[10px] text-red-400">Escalation risk</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Resolved & Verified</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {metrics.resolved_complaints || 0}
          </div>
          <span className="text-[10px] text-emerald-400">Completed</span>
        </div>
      </div>

      {/* Grid: Recent Street Complaints & Available Workers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Complaints List */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Street Complaints</h3>
              <p className="text-xs text-slate-500">Complaints within {street?.name || 'your street'}</p>
            </div>
            <Link
              to="/street-head/complaints"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All ({metrics.total_complaints || 0})
            </Link>
          </div>

          <div className="space-y-3">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                No complaints currently reported on this street corridor. All clear!
              </div>
            ) : (
              recent.slice(0, 6).map(c => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{c.complaint_code}</span>
                      <PriorityBadge priority={c.priority} size="sm" />
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{c.title}</h4>
                    <div className="text-[11px] text-slate-400">
                      Category: {c.category} &bull; Resident: {c.resident_name}
                    </div>
                  </div>

                  <Link
                    to={`/complaints/${c.id}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-100"
                  >
                    Action
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Maintenance Workers */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                Maintenance Fleet
              </h3>
              <p className="text-xs text-slate-500">Personnel availability</p>
            </div>
            <Link
              to="/street-head/workers"
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {workers.map(w => (
              <div
                key={w.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{w.name}</div>
                  <div className="text-[11px] text-slate-500">{w.department}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    w.status === 'available'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {w.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {w.active_tasks_count} active tasks
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
