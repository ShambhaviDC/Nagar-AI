import React from 'react';
import {
  FileText, CheckCircle2, UserCheck, Wrench,
  CheckCheck, AlertOctagon, RefreshCw
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'sm' }) => {
  const configs = {
    registered: {
      label: 'Registered',
      classes: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      icon: FileText,
    },
    acknowledged: {
      label: 'Acknowledged',
      classes: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      icon: CheckCircle2,
    },
    worker_assigned: {
      label: 'Worker Assigned',
      classes: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      icon: UserCheck,
    },
    in_progress: {
      label: 'In Progress',
      classes: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      icon: Wrench,
    },
    resolved: {
      label: 'Resolved (Pending Confirm)',
      classes: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
      icon: CheckCheck,
    },
    verified: {
      label: 'Verified & Closed',
      classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      icon: CheckCheck,
    },
    reopened: {
      label: 'Reopened',
      classes: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
      icon: RefreshCw,
    },
    escalated: {
      label: 'Escalated to Central',
      classes: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 font-bold',
      icon: AlertOctagon,
    },
  };

  const config = configs[status] || configs.registered;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${config.classes}`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{config.label}</span>
    </span>
  );
};
