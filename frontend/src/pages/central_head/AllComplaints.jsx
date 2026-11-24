import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { ListOrdered, Search, RefreshCw, ArrowRight } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStreet, setFilterStreet] = useState('ALL');
  const [streets, setStreets] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/complaints');
      setComplaints(data);
      const sList = await apiFetch('/streets');
      setStreets(sList);
    } catch (err) {
      console.warn('Error loading all complaints:', err);
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
      const mCode = c.complaint_code?.toLowerCase().includes(q);
      const mTitle = c.title?.toLowerCase().includes(q);
      const mStreet = c.street_name?.toLowerCase().includes(q);
      if (!mCode && !mTitle && !mStreet) return false;
    }
    if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
    if (filterStreet !== 'ALL' && c.street_id !== filterStreet) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            All Locality Complaints
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive registry across all 6 streets in Greenfield Locality
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, title, street..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={filterStreet}
            onChange={(e) => setFilterStreet(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Streets</option>
            {streets.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

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
        </div>
      </div>

      {/* Complaints Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
            <tr>
              <th className="py-3 px-3">Code</th>
              <th className="py-3 px-3">Title</th>
              <th className="py-3 px-3">Street</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Street Head</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                  {c.complaint_code}
                </td>
                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[220px] truncate">
                  {c.title}
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  {c.street_name}
                </td>
                <td className="py-3 px-3">
                  <PriorityBadge priority={c.priority} size="sm" />
                </td>
                <td className="py-3 px-3">
                  <StatusBadge status={c.status} size="sm" />
                </td>
                <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                  {c.assigned_street_head_name}
                </td>
                <td className="py-3 px-3 text-right">
                  <Link
                    to={`/complaints/${c.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
