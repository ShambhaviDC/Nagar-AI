import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NagarLogo } from '../components/NagarLogo';
import {
  Shield, Cpu, Users, MapPin, CheckCircle, ArrowRight,
  Clock, AlertTriangle, Sparkles, Building2, Layers, BarChart3
} from 'lucide-react';
import { apiFetch } from '../utils/api';

export const LandingPage = () => {
  const { user, demoUsers, switchDemoUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 30, resolved: 14, streets: 6, compliance: '88%' });

  useEffect(() => {
    // If user is already logged in, redirect to their role dashboard
    if (user) {
      if (user.role === 'central_head') navigate('/central');
      else if (user.role === 'street_head') navigate('/street-head');
      else navigate('/resident');
    }
  }, [user]);

  const handleQuickDemo = async (role) => {
    const targetUser = demoUsers.find(u => u.role === role);
    if (targetUser) {
      await switchDemoUser(targetUser.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      {/* Top Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <NagarLogo size="lg" showTagline={true} />
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            Resident Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Next-Generation Locality Civic Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Smarter Neighborhoods. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600">
            Faster Resolutions.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
          NagarAI transforms civic complaint resolution through an intelligent 3-tier hierarchy and 
          eight autonomous AI agents that categorize, prioritize, assign, monitor, and enforce accountability across every street.
        </p>

        {/* 1-Click Role Exploration Box */}
        <div className="mt-10 p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 max-w-3xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Explore Live Demo with Sample Greenfield Locality (6 Streets)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleQuickDemo('central_head')}
              className="flex flex-col items-center p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-500 hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold mb-2">
                L3
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Central Head</span>
              <span className="text-[11px] text-slate-500 text-center mt-1">Full locality map, escalations, intervention & analytics</span>
            </button>

            <button
              onClick={() => handleQuickDemo('street_head')}
              className="flex flex-col items-center p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-500 hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold mb-2">
                L2
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Street Head</span>
              <span className="text-[11px] text-slate-500 text-center mt-1">Manage assigned street, assign workers & verify evidence</span>
            </button>

            <button
              onClick={() => handleQuickDemo('resident')}
              className="flex flex-col items-center p-4 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 hover:shadow-md transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-2">
                L1
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Resident</span>
              <span className="text-[11px] text-slate-500 text-center mt-1">Voice & photo complaints, real-time tracking & confirmation</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3-Tier Hierarchy Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Three-Level Locality Management Architecture
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Clear separation of responsibilities guarantees zero complaints fall through administrative cracks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Level 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Level 1: Resident</h3>
            <p className="text-xs font-semibold text-emerald-600 mt-0.5">Empowered Neighborhood Citizens</p>
            <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> Register complaints via text, voice, and photographs.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> Interactive map location pinning & landmark mentions.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> Track real-time progress & SLA countdowns.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> Mandatory resident verification or 1-click reopening.</li>
            </ul>
          </div>

          {/* Level 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Level 2: Street Head</h3>
            <p className="text-xs font-semibold text-blue-600 mt-0.5">Direct Street-Level Accountability</p>
            <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> Dedicated oversight of assigned street corridor.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> SLA acknowledgement timers (15m P1 to 24h P4).</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> Smart maintenance worker dispatching by workload.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> Resolution photo evidence and repair documentation.</li>
            </ul>
          </div>

          {/* Level 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Level 3: Central Head</h3>
            <p className="text-xs font-semibold text-purple-600 mt-0.5">Locality-Wide Command & Audit</p>
            <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" /> Live GIS map monitoring all 6 streets simultaneously.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" /> Automated escalation intake for inactive street heads.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" /> Street head performance benchmarking & compliance.</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" /> Administrative reassignment and direct intervention.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 8 AI Multi-Agent Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-slate-100/60 dark:bg-slate-900/40 rounded-3xl mb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous Intelligence</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            8 Specialized AI Agents in Action
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm">
            Task-based agent execution orchestrated with structured Pydantic schemas and strict civic policies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { num: "01", name: "Understanding Agent", desc: "NLP extraction of civic asset, issue, location hints, and voice transcripts." },
            { num: "02", name: "Classification & Priority Agent", desc: "Categorization & SLA assignment (P1 Critical to P4 Routine) with safety scoring." },
            { num: "03", name: "Duplicate Detection Agent", desc: "Semantic similarity clustering preventing duplicate dispatch while preserving citizen reports." },
            { num: "04", name: "Smart Assignment Agent", desc: "Geographic routing to street head & department worker recommendation based on workload." },
            { num: "05", name: "Complaint Monitoring Agent", desc: "Continuous SLA timer surveillance flagging stalled or unacknowledged issues." },
            { num: "06", name: "Escalation Agent", desc: "Automated reminders to street heads and official administrative escalations to central head." },
            { num: "07", name: "Verification Agent", desc: "Evidence quality validation and resident confirmation workflow coordination." },
            { num: "08", name: "Analytics & Insights Agent", desc: "Street head accountability scorecards, recurring hotspot discovery, and trend reporting." },
          ].map(agent => (
            <div key={agent.num} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{agent.num}</span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{agent.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>NagarAI &copy; 2026. Built with FastAPI, MongoDB, React, Leaflet & Multi-Agent AI.</p>
        <p className="mt-1 text-slate-400">Greenfield Locality Demo Environment</p>
      </footer>
    </div>
  );
};
