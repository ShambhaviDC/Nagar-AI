import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, User, ArrowRight, Check, X } from 'lucide-react';

export const DemoSwitcher = ({ isOpen, onClose }) => {
  const { user, demoUsers, switchDemoUser } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (!isOpen) return null;

  const handleSwitch = async (uid) => {
    setSwitching(true);
    try {
      await switchDemoUser(uid);
      onClose();
    } catch (err) {
      alert('Failed to switch user: ' + err.message);
    } finally {
      setSwitching(false);
    }
  };

  const centralUsers = demoUsers.filter(u => u.role === 'central_head');
  const streetHeads = demoUsers.filter(u => u.role === 'street_head');
  const residents = demoUsers.filter(u => u.role === 'resident');

  const defaultStreetHeads = [
    { id: 'sh1', name: 'Vikram Sethi - MG Road Head', email: 'head.mgroad@nagarai.gov.in', street_name: 'MG Road (Mahatma Gandhi Road)', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Vikram' },
    { id: 'sh2', name: 'Ananya Iyer - Brigade Road Head', email: 'head.brigade@nagarai.gov.in', street_name: 'Brigade Road', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Ananya' },
    { id: 'sh3', name: 'Suresh Kulkarni - Nehru Marg Head', email: 'head.nehru@nagarai.gov.in', street_name: 'Nehru Marg', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Suresh' },
    { id: 'sh4', name: 'Pooja Hegde - Station Road Head', email: 'head.station@nagarai.gov.in', street_name: 'Station Road', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Pooja' },
    { id: 'sh5', name: 'Mohammed Farooq - Market Street Head', email: 'head.market@nagarai.gov.in', street_name: 'Market Street', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Mohammed' },
    { id: 'sh6', name: 'Kavitha Reddy - Temple Road Head', email: 'head.temple@nagarai.gov.in', street_name: 'Temple Road', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Kavitha' },
    { id: 'sh7', name: 'Ramesh Sharma - Park Avenue Head', email: 'head.park@nagarai.gov.in', street_name: 'Park Avenue', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Ramesh' },
    { id: 'sh8', name: 'Dr. Deepa Nair - Hospital Road Head', email: 'head.hospital@nagarai.gov.in', street_name: 'Hospital Road', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Deepa' },
  ];

  const displayStreetHeads = streetHeads.length > 0 ? streetHeads : defaultStreetHeads;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Greenfield Locality Quick Demo Switcher
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Switch roles with 1-click to test Resident, Street Head, and Central Head capabilities.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Level 3: Central Head */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                Level 3
              </span>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Central Administration (Full Locality Access)
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {centralUsers.map(u => (
                <button
                  key={u.id}
                  disabled={switching}
                  onClick={() => handleSwitch(u.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    user?.id === u.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full bg-slate-200" />
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                  {user?.id === u.id ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <Check className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Level 2: Street Heads */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Level 2
              </span>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Street Heads (Assigned Street Accountability)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayStreetHeads.map(u => (
                <button
                  key={u.id}
                  disabled={switching}
                  onClick={() => handleSwitch(u.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    user?.id === u.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                        {u.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          📍 {u.street_name || u.assigned_street_name || 'Assigned Street'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {u.email.split('@')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                  {user?.id === u.id && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Level 1: Residents */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs font-bold uppercase rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Level 1
              </span>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Residents (Citizens Reporting Complaints)
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {residents.slice(0, 6).map(u => (
                <button
                  key={u.id}
                  disabled={switching}
                  onClick={() => handleSwitch(u.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                    user?.id === u.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-xs text-slate-900 dark:text-white truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                  </div>
                  {user?.id === u.id && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
