import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, ListOrdered, Map,
  Users, AlertTriangle, BarChart3, Bell, Shield,
  FileSpreadsheet, Sliders
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const residentLinks = [
    { to: '/resident', label: 'Home Dashboard', icon: LayoutDashboard },
    { to: '/resident/new-complaint', label: 'Register Complaint', icon: PlusCircle },
    { to: '/resident/street-feed', label: 'Street Complaints & Voting', icon: Users },
    { to: '/resident/my-complaints', label: 'My Complaints', icon: ListOrdered },
    { to: '/map', label: 'Locality Map', icon: Map },
    { to: '/notifications', label: 'Notifications', icon: Bell },
  ];

  const streetHeadLinks = [
    { to: '/street-head', label: 'Street Overview', icon: LayoutDashboard },
    { to: '/street-head/complaints', label: 'Street Complaints', icon: ListOrdered },
    { to: '/street-head/workers', label: 'Worker Management', icon: Users },
    { to: '/map', label: 'Street Map View', icon: Map },
    { to: '/notifications', label: 'Notifications & Alerts', icon: Bell },
  ];

  const centralHeadLinks = [
    { to: '/central', label: 'Central Command', icon: LayoutDashboard },
    { to: '/map', label: 'Interactive Locality Map', icon: Map },
    { to: '/central/all-complaints', label: 'All Locality Complaints', icon: ListOrdered },
    { to: '/central/performance', label: 'Street Head Accountability', icon: Users },
    { to: '/central/escalations', label: 'Escalations & Interventions', icon: AlertTriangle },
    { to: '/central/analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { to: '/notifications', label: 'System Notifications', icon: Bell },
  ];

  const links =
    role === 'central_head'
      ? centralHeadLinks
      : role === 'street_head'
      ? streetHeadLinks
      : residentLinks;

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-4 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Current Context
        </div>
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
          {role === 'central_head'
            ? 'Greenfield Locality (All Streets)'
            : role === 'street_head'
            ? 'Assigned Street Command'
            : 'Resident Citizen Portal'}
        </div>
      </div>

      <nav className="space-y-1">
        {links.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/resident' || item.to === '/street-head' || item.to === '/central'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
