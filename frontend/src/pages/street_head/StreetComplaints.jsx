import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ListOrdered, CheckCircle2, UserCheck, Wrench, RefreshCw,
  Search, ArrowRight, Eye, ShieldAlert
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const StreetComplaints = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'all';

  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const tabParam = currentTab !== 'all' ? `?tab=${currentTab}` : '';
      const data = await apiFetch(`/street-head/complaints${tabParam}`);
      setComplaints(data);
      const wList = await apiFetch('/street-head/workers');
      setWorkers(wList);
    } catch (err) {
      console.warn('Error loading street complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTab]);

  const tabs = [
    { key: 'all', label: 'All Complaints' },
    { key: 'new', label: 'New (Unacknowledged)' },
    { key: 'assigned', label: 'Worker Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'overdue', label: 'Overdue (SLA Breach)' },
    { key: 'resolved', label: 'Resolved / Closed' },
  ];

  const handleAcknowledge = async (id) => {
    try {
      await apiFetch(`/complaints/${id}/acknowledge`, { method: 'POST' });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickAssign = async (id, workerId) => {
    if (!workerId) return;
    try {
      await apiFetch(`/complaints/${id}/assign-worker`, {
        method: 'POST',
        body: JSON.stringify({ worker_id: workerId, instructions: 'Immediate site repair dispatched' }),
      });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = complaints.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.complaint_code?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Street Complaints Triage
          </h1>
          <p className="text-xs text-slate-500">
            Acknowledge new issues, dispatch maintenance workers, and manage resolution evidence
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ tab: t.key })}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              currentTab === t.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading complaints...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No complaints found in this category.
          </div>
        ) : (
          filtered.map(c => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {c.complaint_code}
                  </span>
                  <PriorityBadge priority={c.priority} size="sm" />
                  <StatusBadge status={c.status} size="sm" />
                  <span className="text-[11px] text-slate-400">
                    &bull; Resident: {c.resident_name} ({c.resident_phone || 'N/A'})
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Category: <strong className="text-slate-700 dark:text-slate-300">{c.category}</strong></span>
                  <span>
                    Ack Deadline:{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {c.acknowledgement_deadline ? new Date(c.acknowledgement_deadline).toLocaleTimeString() : 'N/A'}
                    </strong>
                  </span>
                  {c.worker_name && (
                    <span>Worker: <strong className="text-purple-600">{c.worker_name}</strong></span>
                  )}
                </div>
              </div>

              {/* Action Buttons for Street Head */}
              <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                {c.status === 'registered' && (
                  <button
                    onClick={() => handleAcknowledge(c.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                  >
                    Acknowledge
                  </button>
                )}

                {!c.worker_name && c.status !== 'resolved' && (
                  <select
                    onChange={(e) => handleQuickAssign(c.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                    defaultValue=""
                  >
                    <option value="" disabled>Dispatch Worker...</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.department})
                      </option>
                    ))}
                  </select>
                )}

                <Link
                  to={`/complaints/${c.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
