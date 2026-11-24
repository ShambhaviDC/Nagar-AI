import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Users, ThumbsUp, MapPin, Search, Filter, Camera, Mic,
  AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, MessageSquare
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_FEED_STREETS = [
  { id: 'MGR-01', code: 'MGR-01', name: 'MG Road (Mahatma Gandhi Road)' },
  { id: 'BRG-02', code: 'BRG-02', name: 'Brigade Road' },
  { id: 'NHR-03', code: 'NHR-03', name: 'Nehru Marg' },
  { id: 'STN-04', code: 'STN-04', name: 'Station Road' },
  { id: 'MKT-05', code: 'MKT-05', name: 'Market Street' },
  { id: 'TMP-06', code: 'TMP-06', name: 'Temple Road' },
  { id: 'PRK-07', code: 'PRK-07', name: 'Park Avenue' },
  { id: 'HSP-08', code: 'HSP-08', name: 'Hospital Road' },
];

export const StreetFeed = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [streets, setStreets] = useState(DEFAULT_FEED_STREETS);
  const [selectedStreetId, setSelectedStreetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  const loadStreets = async () => {
    try {
      const data = await apiFetch('/streets');
      setStreets(data);
    } catch (err) {
      console.warn('Error loading streets:', err);
    }
  };

  const loadFeed = async (streetId = '') => {
    setLoading(true);
    try {
      const query = streetId ? `?street_id=${streetId}` : '';
      const data = await apiFetch(`/complaints/street-feed${query}`);
      setComplaints(data);
    } catch (err) {
      console.warn('Error loading street feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreets();
    loadFeed();
  }, []);

  const handleStreetFilter = (e) => {
    const sId = e.target.value;
    setSelectedStreetId(sId);
    loadFeed(sId);
  };

  const handleVote = async (complaintId) => {
    setVotingId(complaintId);
    try {
      const updated = await apiFetch(`/complaints/${complaintId}/vote`, {
        method: 'POST',
      });
      setComplaints(prev => prev.map(c => c.id === complaintId ? updated : c));
      
      const voteCount = updated.upvotes_count;
      if (updated.has_upvoted) {
        if (voteCount >= 4) {
          setToastMessage(`🔥 Upvoted! Complaint escalated to P1 Critical (${voteCount} residents affected)`);
        } else if (voteCount >= 2) {
          setToastMessage(`👍 Upvoted! Problem to all residents confirmed (${voteCount} votes)`);
        } else {
          setToastMessage('👍 Your endorsement recorded! Community votes factor into severity.');
        }
      } else {
        setToastMessage('Upvote withdrawn.');
      }
      setTimeout(() => setToastMessage(''), 4500);
    } catch (err) {
      alert('Failed to register vote: ' + err.message);
    } finally {
      setVotingId(null);
    }
  };

  const filtered = complaints.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      const matchCode = c.complaint_code?.toLowerCase().includes(q);
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchCat && !matchDesc) return false;
    }
    if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-700 text-white shadow-xl flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
              Community Street Corroboration
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
              Live Resident Voting
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Street Complaints & Consensus Feed
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 leading-relaxed">
            See all civic issues reported on your street and locality. Upvote complaints affecting your household ("Problem to all residents") so the AI agents automatically elevate their priority and fast-track repairs.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search street complaints by title, category, issue..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        {/* Street Selector */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <select
              value={selectedStreetId}
              onChange={handleStreetFilter}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-none"
            >
              <option value="">All Locality Streets</option>
              {streets.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1 Critical</option>
            <option value="P2">P2 High</option>
            <option value="P3">P3 Medium</option>
            <option value="P4">P4 Low</option>
          </select>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading community street feed...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No active complaints found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no matching issues reported on this street. You can report a new issue anytime.
          </p>
          <Link
            to="/resident/new-complaint"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
          >
            Report New Complaint
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(complaint => {
            const hasVoted = complaint.has_upvoted;
            const voteCount = complaint.upvotes_count || 0;
            const isAllResidentsIssue = voteCount >= 2;
            const hasImage = complaint.image_urls && complaint.image_urls.length > 0;
            const imageScan = complaint.image_scan_result || {};

            return (
              <div
                key={complaint.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Code, Category, Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {complaint.complaint_code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={complaint.priority} size="sm" />
                      <StatusBadge status={complaint.status} size="sm" />
                    </div>
                  </div>

                  {/* Title & Street */}
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-2 leading-snug">
                    {complaint.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {complaint.street_name || 'Greenfield Locality'}
                    </span>
                    {complaint.landmark && (
                      <>
                        <span>&bull;</span>
                        <span className="truncate">Near {complaint.landmark}</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {complaint.description}
                  </p>

                  {/* Media Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {hasImage && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        <Camera className="w-3 h-3" />
                        <span>AI Image Verified ({complaint.image_urls.length})</span>
                      </span>
                    )}
                    {complaint.voice_transcript && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                        <Mic className="w-3 h-3" />
                        <span>Voice Input Scanned</span>
                      </span>
                    )}
                    {isAllResidentsIssue && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <Users className="w-3 h-3" />
                        <span>Problem to All Residents ({voteCount} votes)</span>
                      </span>
                    )}
                  </div>

                  {/* Image Preview if available */}
                  {hasImage && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 max-h-36 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={complaint.image_urls[0]}
                        alt="Civic defect evidence"
                        className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Upvote Button & Detail Link */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleVote(complaint.id)}
                    disabled={votingId === complaint.id}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      hasVoted
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/50'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    title={hasVoted ? 'Click to withdraw upvote' : 'Click to endorse: I am also affected by this issue'}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                    <span>
                      {hasVoted ? 'You & ' : ''}{voteCount} {voteCount === 1 ? 'Resident' : 'Residents'} Affected
                    </span>
                  </button>

                  <Link
                    to={`/complaints/${complaint.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
