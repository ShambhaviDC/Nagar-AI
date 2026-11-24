import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NagarLogo } from './NagarLogo';
import { DemoSwitcher } from './DemoSwitcher';
import {
  Bell, Sun, Moon, LogOut, User, Shield, CheckCircle2,
  ChevronDown, Layers, MapPin
} from 'lucide-react';
import { apiFetch } from '../utils/api';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const navigate = useNavigate();

  const fetchUnreadNotifications = async () => {
    if (!user) return;
    try {
      const notifs = await apiFetch('/notifications?limit=20');
      const unread = notifs.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const roleLabels = {
    central_head: { text: 'Central Head (L3)', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
    street_head: { text: 'Street Head (L2)', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    resident: { text: 'Resident (L1)', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  };

  const currentRole = roleLabels[user?.role] || roleLabels.resident;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <NagarLogo size="md" showTagline={false} />
          </Link>

          {/* Right Tools & Profile */}
          <div className="flex items-center gap-3">
            {/* 1-Click Demo Switcher Button */}
            <button
              onClick={() => setShowDemoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Demo Role Switcher</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdown(prev => !prev)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt=""
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                    />
                    <div className="hidden md:flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                        {user.name}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full self-start ${currentRole.bg}`}>
                        {currentRole.text}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {profileDropdown && (
                    <div
                      onMouseLeave={() => setProfileDropdown(false)}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded ${currentRole.bg}`}>
                          {currentRole.text}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setProfileDropdown(false);
                          setShowDemoModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        Switch Demo Account
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdown(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <DemoSwitcher isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </>
  );
};
