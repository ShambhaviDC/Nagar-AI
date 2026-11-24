import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge } from '../../components/PriorityBadge';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Clock, CheckCircle2, AlertTriangle, User, Shield, Wrench,
  MapPin, Star, RefreshCw, Send, ArrowLeft, Image, FileText,
  AlertOctagon, CheckCheck, Cpu, ThumbsUp, Camera, Sparkles
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Street Head actions
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Central Head intervention
  const [interventionNotes, setInterventionNotes] = useState('');

  const loadComplaint = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/complaints/${id}`);
      setComplaint(data);
      const hist = await apiFetch(`/complaints/${id}/history`);
      setHistory(hist);

      if (['street_head', 'central_head'].includes(user?.role)) {
        const wList = await apiFetch('/street-head/workers');
        setWorkers(wList);
      }
    } catch (err) {
      alert('Error loading complaint: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaint();
  }, [id]);

  // Street Head: Acknowledge
  const handleAcknowledge = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/complaints/${id}/acknowledge`, { method: 'POST' });
      await loadComplaint();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Street Head: Assign Worker
  const handleAssignWorker = async () => {
    if (!selectedWorkerId) return alert('Select a worker');
    setActionLoading(true);
    try {
      await apiFetch(`/complaints/${id}/assign-worker`, {
        method: 'POST',
        body: JSON.stringify({ worker_id: selectedWorkerId, instructions: 'Immediate site inspection' }),
      });
      await loadComplaint();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Street Head: Mark Resolved
  const handleResolve = async () => {
    if (!resolutionNotes) return alert('Provide resolution notes');
    setActionLoading(true);
    try {
      await apiFetch(`/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'resolved',
          resolution_notes: resolutionNotes,
          resolution_image_urls: ['https://picsum.photos/seed/repairdone/600/400'],
        }),
      });
      await loadComplaint();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Resident: Submit Feedback
  const handleFeedback = async (satisfied = true) => {
    setActionLoading(true);
    try {
      await apiFetch(`/complaints/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: feedbackComment || 'Resolution verified by resident.',
          is_satisfied: satisfied,
        }),
      });
      await loadComplaint();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Resident: Reopen
  const handleReopen = async () => {
    if (!reopenReason) return alert('Please explain why the issue is unresolved');
    setActionLoading(true);
    try {
      await apiFetch(`/complaints/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ reason: reopenReason }),
      });
      setShowReopenModal(false);
      await loadComplaint();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Central Head: Intervene
  const handleCentralIntervene = async () => {
    if (!interventionNotes) return alert('Provide intervention directive');
    setActionLoading(true);
    try {
      await apiFetch(`/central/complaints/${id}/intervene`, {
        method: 'POST',
        body: JSON.stringify({
          intervention_notes: interventionNotes,
          elevate_priority: 'P1',
          direct_action: 'Administrative Intervention Issued',
        }),
      });
      await loadComplaint();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Resident / Neighbor: Upvote / Endorse
  const handleVote = async () => {
    setActionLoading(true);
    try {
      const updated = await apiFetch(`/complaints/${id}/vote`, {
        method: 'POST',
      });
      setComplaint(updated);
    } catch (err) {
      alert('Failed to register vote: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading complaint details...</div>;
  }

  if (!complaint) {
    return <div className="p-12 text-center text-xs text-red-500">Complaint not found.</div>;
  }

  const steps = [
    { key: 'registered', label: 'Registered' },
    { key: 'acknowledged', label: 'Acknowledged' },
    { key: 'worker_assigned', label: 'Worker Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'verified', label: 'Verified & Closed' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === complaint.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Back & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} size="md" />
          <StatusBadge status={complaint.status} size="md" />
        </div>
      </div>

      {/* Main Overview Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            <span>{complaint.complaint_code}</span>
            <span>&bull;</span>
            <span>{complaint.category}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {complaint.title}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {complaint.description}
          </p>

          {/* Community Endorsement & Severity Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleVote}
                disabled={actionLoading}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  complaint.has_upvoted
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/50'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title={complaint.has_upvoted ? 'Click to withdraw your vote' : 'I am also affected by this street issue'}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${complaint.has_upvoted ? 'fill-current' : ''}`} />
                <span>
                  {complaint.has_upvoted ? 'You & ' : ''}{complaint.upvotes_count || 0} {(complaint.upvotes_count || 0) === 1 ? 'Resident' : 'Residents'} Affected
                </span>
              </button>

              {(complaint.upvotes_count || 0) >= 2 && (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Problem to All Residents ({complaint.upvotes_count} votes)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Severity Score:</span>
              <span className="font-extrabold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                {complaint.severity_score || 5}/10
              </span>
            </div>
          </div>
        </div>

        {/* Stepper Progression */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Resolution Milestone Lifecycle
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {steps.map((st, idx) => {
              const isPast = currentStepIndex >= idx || complaint.status === 'verified';
              const isCurrent = complaint.status === st.key;
              return (
                <div
                  key={st.key}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                      : isPast
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/50 dark:bg-slate-800/20'
                  }`}
                >
                  <div className="text-[10px] font-semibold">{idx + 1}</div>
                  <div className="text-[11px] mt-0.5 truncate">{st.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Street:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{complaint.street_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Assigned Street Head:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {complaint.assigned_street_head_name || 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Maintenance Worker:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {complaint.worker_name || 'Pending assignment'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Resolution Deadline:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {complaint.resolution_deadline
                ? new Date(complaint.resolution_deadline).toLocaleString()
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Complaint Images if any */}
        {complaint.image_urls && complaint.image_urls.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Citizen Evidence Photographs
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                <Camera className="w-3 h-3" />
                <span>AI Vision Scanned</span>
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {complaint.image_urls.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt="Evidence"
                  className="w-32 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform"
                />
              ))}
            </div>

            {/* AI Vision Severity Scan Panel */}
            {complaint.image_scan_result && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>AI Visual Severity Assessment</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    complaint.image_scan_result.visual_severity === 'Critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      : complaint.image_scan_result.visual_severity === 'High'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {complaint.image_scan_result.visual_severity} Severity
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {complaint.image_scan_result.description || complaint.image_scan_result.detected_defect}
                </p>
                {complaint.image_scan_result.hazard_detected && (
                  <div className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Active ground hazard corroborated by photograph</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resolution Evidence Card (if resolved or verified) */}
      {complaint.resolution_notes && (
        <div className="p-6 rounded-3xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/50 space-y-3">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-sm">
            <CheckCheck className="w-5 h-5 text-teal-600" />
            <span>Street Maintenance Resolution Evidence</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            "{complaint.resolution_notes}"
          </p>
          {complaint.resolution_image_urls && complaint.resolution_image_urls.length > 0 && (
            <div className="flex gap-2 mt-2">
              {complaint.resolution_image_urls.map((u, i) => (
                <img key={i} src={u} alt="" className="w-24 h-20 object-cover rounded-lg border border-teal-200" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resident Confirmation / Verification Action */}
      {complaint.status === 'resolved' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Citizen Confirmation Required
              </h3>
              <p className="text-xs text-slate-500">
                Please verify if the defect has been properly rectified.
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRating(st)}
                  className={`p-1 rounded ${rating >= st ? 'text-amber-400' : 'text-slate-300'}`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Optional comments on repair quality..."
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFeedback(true)}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Confirm Resolved & Close (Verified)
            </button>
            <button
              onClick={() => setShowReopenModal(true)}
              className="px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-red-600 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Reopen (Issue Persists)
            </button>
          </div>
        </div>
      )}

      {/* Street Head Management Box (shown to Street Head or Central Head) */}
      {['street_head', 'central_head'].includes(user?.role) && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            Street Head Operations Panel
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Step 1: Acknowledge */}
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Step 1</span>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Acknowledge Receipt
              </div>
              <button
                onClick={handleAcknowledge}
                disabled={actionLoading || complaint.status !== 'registered'}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
              >
                {complaint.acknowledged_at ? 'Acknowledged' : 'Acknowledge Now'}
              </button>
            </div>

            {/* Step 2: Assign Worker */}
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Step 2</span>
              <select
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              >
                <option value="">Select Technician</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.department}) - {w.active_tasks_count} tasks
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignWorker}
                disabled={actionLoading || !selectedWorkerId}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40"
              >
                Dispatch Worker
              </button>
            </div>

            {/* Step 3: Mark Resolved */}
            <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Step 3</span>
              <input
                type="text"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Notes: wire re-insulated, pothole patched..."
                className="w-full px-2 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={handleResolve}
                disabled={actionLoading || ['resolved', 'verified'].includes(complaint.status)}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
              >
                Upload Evidence & Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Central Head Intervention Panel */}
      {user?.role === 'central_head' && (
        <div className="p-6 rounded-3xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 space-y-3">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-sm">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>Central Administration Override & Intervention</span>
          </div>
          <p className="text-xs text-slate-500">
            Override street head delays, elevate to emergency P1 priority, or issue direct work orders.
          </p>
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={interventionNotes}
              onChange={(e) => setInterventionNotes(e.target.value)}
              placeholder="Enter central directive notes..."
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-slate-900 dark:text-white"
            />
            <button
              onClick={handleCentralIntervene}
              disabled={actionLoading || !interventionNotes}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              Issue Directive
            </button>
          </div>
        </div>
      )}

      {/* AI Multi-Agent Audit Inspection Panel */}
      {complaint.ai_metadata && (
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>AI Multi-Agent Pipeline Telemetry</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Priority Justification
              </span>
              <p className="text-slate-500 text-[11px]">
                {complaint.ai_metadata?.priority_assessment?.justification || 'Safety and impact scoring'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Duplicate Detection
              </span>
              <p className="text-slate-500 text-[11px]">
                {complaint.ai_metadata?.duplicate_detection?.explanation || 'No duplicates found.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Routing & Recommended Department
              </span>
              <p className="text-slate-500 text-[11px]">
                {complaint.worker_department} via Street Head {complaint.assigned_street_head_name}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Audit Trail History */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          Complete Audit Trail History
        </h3>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {history.map((h, i) => (
            <div key={h.id || i} className="relative flex items-start gap-3 pl-8">
              <span className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900"></span>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 capitalize">
                    {h.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{h.details}</p>
                <div className="text-[10px] text-slate-400 mt-1">
                  Actor: <strong className="text-slate-600 dark:text-slate-300">{h.performed_by_name}</strong> ({h.performed_by_role})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-orange-500" />
              Reopen Unresolved Complaint
            </h3>
            <p className="text-xs text-slate-500">
              Explain why the repair was inadequate. Priority will be automatically elevated.
            </p>
            <textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. Streetlight worked for 1 hour then went off again, water pipeline leaking again..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReopen}
                disabled={actionLoading || !reopenReason}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-600 text-white hover:bg-orange-700"
              >
                Confirm Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
