import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { AlertOctagon, RefreshCw, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const EscalationsView = () => {
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/central/overdue-complaints');
      setOverdue(data);
    } catch (err) {
      console.warn('Failed to load overdue complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-red-600" />
            Escalations & Overdue Operations
          </h1>
          <p className="text-xs text-slate-500">
            Complaints breaching SLA deadlines requiring administrative override or direct reassignment
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading escalations...</div>
        ) : overdue.length === 0 ? (
          <div className="p-12 text-center text-xs text-emerald-600 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No overdue or escalated complaints at this moment. Excellent locality compliance!
          </div>
        ) : (
          overdue.map(c => (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{c.complaint_code}</span>
                  <PriorityBadge priority={c.priority} size="sm" />
                  <StatusBadge status={c.status} size="sm" />
                  <span className="font-bold text-red-600">OVERDUE</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.title}</h3>
                <p className="text-slate-500">{c.description}</p>
                <div className="flex items-center gap-4 text-slate-400 pt-1 text-[11px]">
                  <span>Street: <strong className="text-slate-700 dark:text-slate-300">{c.street_name}</strong></span>
                  <span>Street Head: <strong className="text-slate-700 dark:text-slate-300">{c.assigned_street_head_name}</strong></span>
                  <span>
                    Deadline was: <strong className="text-red-600">{new Date(c.resolution_deadline).toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <Link
                  to={`/complaints/${c.id}`}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Administrative Intervene</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
