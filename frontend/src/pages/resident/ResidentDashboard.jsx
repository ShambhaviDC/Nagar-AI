import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import {
  PlusCircle, ListOrdered, CheckCircle2, Clock,
  AlertTriangle, ArrowRight, MapPin, RefreshCw, Eye, Users
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const ResidentDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/complaints/my');
      setComplaints(data);
    } catch (err) {
      console.warn('Failed to load my complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = complaints.length;
  const active = complaints.filter(c => !['resolved', 'verified'].includes(c.status)).length;
  const resolved = complaints.filter(c => ['resolved', 'verified'].includes(c.status)).length;
  const pendingConfirm = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
            Citizen Resident Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
            Welcome back, {user?.name}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 leading-relaxed">
            Report locality infrastructure defects, track maintenance progress in real time, and confirm street repairs.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/resident/new-complaint"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>Report New Complaint</span>
            </Link>
            <Link
              to="/resident/street-feed"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all"
            >
              <Users className="w-4 h-4 text-white" />
              <span>Street Feed & Voting</span>
            </Link>
            <Link
              to="/map"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-white font-semibold text-xs border border-white/20 transition-all"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Explore Street Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Submitted</span>
            <ListOrdered className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{active}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resolved & Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{resolved}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Awaiting Your Confirm</span>
            <RefreshCw className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">{pendingConfirm}</div>
        </div>
      </div>

      {/* Recent Complaints Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Complaints</h3>
            <p className="text-xs text-slate-500">Track resolution milestones and view assigned personnel</p>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No complaints filed yet. Tap "Report New Complaint" above to register an issue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-3">Complaint Code</th>
                  <th className="py-3 px-3">Issue Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Street Head</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {complaints.slice(0, 8).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {c.complaint_code}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                      {c.title}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {c.category}
                    </td>
                    <td className="py-3 px-3">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {c.assigned_street_head_name || 'Assigned automatically'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
