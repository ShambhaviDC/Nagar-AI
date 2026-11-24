import React from 'react';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

export const PriorityBadge = ({ priority, size = 'sm' }) => {
  const configs = {
    P1: {
      label: 'P1 Critical',
      desc: '15m SLA',
      classes: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
      icon: AlertCircle,
      pulse: true,
    },
    P2: {
      label: 'P2 High',
      desc: '2h SLA',
      classes: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      icon: AlertTriangle,
      pulse: false,
    },
    P3: {
      label: 'P3 Medium',
      desc: '12h SLA',
      classes: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      icon: Info,
      pulse: false,
    },
    P4: {
      label: 'P4 Low',
      desc: '24h SLA',
      classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      icon: Clock,
      pulse: false,
    },
  };

  const config = configs[priority] || configs.P3;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${config.classes}`}
    >
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
      )}
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{config.label}</span>
      <span className="opacity-75 font-normal text-[11px]">({config.desc})</span>
    </span>
  );
};
