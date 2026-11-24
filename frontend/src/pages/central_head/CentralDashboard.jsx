import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Shield, Building2, AlertTriangle, AlertOctagon, CheckCircle2,
  Users, Map, BarChart3, RefreshCw, Zap, ArrowRight, Eye, Sliders
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const CentralDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surveillanceRunning, setSurveillanceRunning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/central/dashboard');
      setData(res);
    } catch (err) {
      console.warn('Error loading central dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSurveillance = async () => {
    setSurveillanceRunning(true);
    try {
      await apiFetch('/central/trigger-surveillance', { method: 'POST' });
      await loadData();
      alert('AI Surveillance and Escalation Cycle completed successfully!');
    } catch (err) {
      alert('Error triggering surveillance: ' + err.message);
    } finally {
      setSurveillanceRunning(false);
    }
  };

  const metrics = data?.metrics || {};
  const locality = data?.locality;
  const streets = data?.streets_summary || [];
  const escalations = data?.recent_escalations || [];

  return (
    <div className="space-y-6">
      {/* Central Command Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
              <Shield className="w-3.5 h-3.5 text-purple-300" />
              <span>Level 3: Central Command Headquarters</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
              {locality?.name || 'Greenfield Locality'} Civic Overview
            </h1>
            <p className="text-purple-200 text-xs sm:text-sm mt-1">
              Central Administrator: <strong>{user?.name}</strong> &bull; {streets.length} Street Commands Connected
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={triggerSurveillance}
              disabled={surveillanceRunning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{surveillanceRunning ? 'Agent Scanning...' : 'Run Surveillance Job'}</span>
            </button>
            <Link
              to="/map"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              <Map className="w-4 h-4 text-emerald-400" />
              <span>Locality GIS Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Total Locality Issues</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {metrics.total_complaints || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Active Pending</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {metrics.pending_complaints || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Resolved / Closed</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.resolved_complaints || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Overdue (SLA Breached)</span>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
            {metrics.overdue_complaints || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">P1 Critical Hazards</span>
          <div className="text-2xl font-extrabold text-red-500 mt-1 animate-pulse">
            {metrics.critical_p1_complaints || 0}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Active Escalations</span>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {metrics.active_escalations || 0}
          </div>
        </div>
      </div>

      {/* Active Escalations Alert Box */}
      {escalations.length > 0 && (
        <div className="p-6 rounded-3xl bg-red-50/70 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-900 dark:text-red-300 font-bold text-sm">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <span>Active Escalations Requiring Central Administrative Intervention</span>
            </div>
            <Link
              to="/central/escalations"
              className="text-xs font-bold text-red-700 dark:text-red-400 hover:underline"
            >
              View Escalation Center &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {escalations.slice(0, 4).map(e => (
              <div
                key={e.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/80 shadow-sm space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{e.street_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                    Level {e.escalation_level} Escalation
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{e.reason}</p>
                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Head: {e.street_head_name}</span>
                  <Link
                    to={`/complaints/${e.complaint_id}`}
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Intervene Direct &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Street-Wise Performance Command Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Street Heads & Locality Corridors
            </h3>
            <p className="text-xs text-slate-500">Live accountability status across all 6 streets</p>
          </div>
          <Link
            to="/central/performance"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Detailed Scorecard &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-3">Street Corridor</th>
                <th className="py-3 px-3">Assigned Street Head</th>
                <th className="py-3 px-3 text-center">Active</th>
                <th className="py-3 px-3 text-center">Resolved</th>
                <th className="py-3 px-3 text-center">Overdue</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {streets.map(st => (
                <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {st.name} <span className="text-slate-400 font-normal">({st.code})</span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                    {st.street_head_name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-blue-600">
                    {st.active_count || 0}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-600">
                    {st.resolved_count || 0}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-red-600">
                    {st.overdue_count || 0}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/map?street=${st.id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                    >
                      Map View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
