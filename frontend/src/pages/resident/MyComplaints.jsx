import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { ListOrdered, Search, Filter, ArrowRight, RefreshCw, PlusCircle } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/complaints/my');
      setComplaints(data);
    } catch (err) {
      console.warn('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = complaints.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const matchCode = c.complaint_code?.toLowerCase().includes(q);
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchCat) return false;
    }
    if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
    if (filterStatus === 'ACTIVE' && ['resolved', 'verified'].includes(c.status)) return false;
    if (filterStatus === 'RESOLVED' && !['resolved', 'verified'].includes(c.status)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            My Registered Complaints
          </h1>
          <p className="text-xs text-slate-500">
            Historical records and live tracking of your neighborhood maintenance requests
          </p>
        </div>
        <Link
          to="/resident/new-complaint"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Complaint</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by complaint code, title or category..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1 Critical</option>
            <option value="P2">P2 High</option>
            <option value="P3">P3 Medium</option>
            <option value="P4">P4 Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active / In-Progress</option>
            <option value="RESOLVED">Resolved & Verified</option>
          </select>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading complaints...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No complaints found matching your search.
          </div>
        ) : (
          filtered.map(c => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {c.complaint_code}
                  </span>
                  <PriorityBadge priority={c.priority} size="sm" />
                  <StatusBadge status={c.status} size="sm" />
                  <span className="text-[11px] text-slate-400">
                    &bull; {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {c.description}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Street: <strong className="text-slate-700 dark:text-slate-300">{c.street_name}</strong></span>
                  <span>Category: <strong className="text-slate-700 dark:text-slate-300">{c.category}</strong></span>
                  {c.worker_name && (
                    <span>Assigned: <strong className="text-emerald-600">{c.worker_name}</strong></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link
                  to={`/complaints/${c.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors"
                >
                  <span>Track & Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
