import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { LocalityMap } from '../../components/LocalityMap';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  PlusCircle, MapPin, Sparkles, Image, Check, AlertCircle,
  Cpu, ArrowRight, ShieldCheck, Layers
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const DEFAULT_COMMON_STREETS = [
  { id: 'MGR-01', code: 'MGR-01', name: 'MG Road (Mahatma Gandhi Road)', center_lat: 12.9358, center_lng: 77.6235 },
  { id: 'BRG-02', code: 'BRG-02', name: 'Brigade Road', center_lat: 12.9365, center_lng: 77.6248 },
  { id: 'NHR-03', code: 'NHR-03', name: 'Nehru Marg', center_lat: 12.9348, center_lng: 77.6256 },
  { id: 'STN-04', code: 'STN-04', name: 'Station Road', center_lat: 12.9339, center_lng: 77.6240 },
  { id: 'MKT-05', code: 'MKT-05', name: 'Market Street', center_lat: 12.9344, center_lng: 77.6228 },
  { id: 'TMP-06', code: 'TMP-06', name: 'Temple Road', center_lat: 12.9360, center_lng: 77.6260 },
  { id: 'PRK-07', code: 'PRK-07', name: 'Park Avenue', center_lat: 12.9370, center_lng: 77.6245 },
  { id: 'HSP-08', code: 'HSP-08', name: 'Hospital Road', center_lat: 12.9330, center_lng: 77.6250 },
];

export const RegisterComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [streets, setStreets] = useState(DEFAULT_COMMON_STREETS);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [selectedStreetId, setSelectedStreetId] = useState(user?.street_id || DEFAULT_COMMON_STREETS[0].id);
  const [localityId, setLocalityId] = useState(user?.locality_id || '');
  const [landmark, setLandmark] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [pickedPos, setPickedPos] = useState({ lat: 12.9358, lng: 77.6235 });

  const [aiPreview, setAiPreview] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    "Streetlights", "Electricity", "Water supply", "Plumbing", "Drainage",
    "Garbage collection", "Road damage", "Public infrastructure", "Sanitation",
    "Public safety", "Other locality-related issues"
  ];

  useEffect(() => {
    const fetchStreets = async () => {
      try {
        const data = await apiFetch('/streets');
        setStreets(data);
        if (data.length > 0 && !selectedStreetId) {
          setSelectedStreetId(data[0].id);
          setLocalityId(data[0].locality_id);
          setPickedPos({ lat: data[0].center_lat, lng: data[0].center_lng });
        }
      } catch (err) {
        console.warn('Error fetching streets:', err);
      }
    };
    fetchStreets();
  }, []);

  const handleStreetChange = (e) => {
    const sId = e.target.value;
    setSelectedStreetId(sId);
    const matched = streets.find(s => s.id === sId);
    if (matched) {
      setLocalityId(matched.locality_id);
      setPickedPos({ lat: matched.center_lat, lng: matched.center_lng });
    }
  };

  const handleVoiceTranscript = (transcriptText) => {
    setVoiceTranscript(transcriptText);
    if (!description && transcriptText) {
      setDescription(transcriptText);
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]);
      try {
        const res = await apiFetch('/upload', {
          method: 'POST',
          body: formData,
        });
        setImageUrls(prev => [...prev, res.url]);
      } catch (err) {
        alert('Image upload failed: ' + err.message);
      }
    }
  };

  const runAiPreAssessment = async () => {
    if (!description || description.trim().length < 5) return;
    setAnalyzingAi(true);
    try {
      const res = await apiFetch('/ai/analyze-complaint', {
        method: 'POST',
        body: JSON.stringify({
          text: description,
          voice_transcript: voiceTranscript,
          image_urls: imageUrls,
        }),
      });
      setAiPreview(res);
      if (res.title && !title) setTitle(res.title);
      if (res.suggested_category && !category) setCategory(res.suggested_category);
    } catch (err) {
      console.warn('AI analysis error:', err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const effectiveText = (description || '').trim() || (voiceTranscript || '').trim() || (landmark || '').trim();
    if (!effectiveText && imageUrls.length === 0) {
      setError('Please provide a description, speak via voice-to-text, or attach a photograph.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        description: description.trim() || voiceTranscript.trim() || undefined,
        locality_id: localityId,
        street_id: selectedStreetId,
        landmark: landmark || undefined,
        latitude: pickedPos?.lat,
        longitude: pickedPos?.lng,
        image_urls: imageUrls,
        voice_transcript: voiceTranscript || undefined,
      };

      const result = await apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      navigate(`/complaints/${result.id}`);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Registration</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
          Register Civic Complaint
        </h1>
        <p className="text-xs text-slate-500">
          Describe the problem in your own words. The multi-agent orchestrator will classify and route it to your street head.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          {/* Street Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Affected Street in Greenfield Locality *
              </label>
              <select
                required
                value={selectedStreetId}
                onChange={handleStreetChange}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {streets.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) - Head: {s.street_head_name || 'Assigned'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Landmark / House No / Pole Ref
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Community Hall, near Transformer #2"
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Voice Complaint Recorder */}
          <VoiceRecorder onTranscriptReady={handleVoiceTranscript} />

          {/* Description Textarea (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description (Optional)
              </label>
              {(description || voiceTranscript) && (
                <button
                  type="button"
                  onClick={runAiPreAssessment}
                  disabled={analyzingAi}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{analyzingAi ? 'AI Assessing...' : 'Test AI Autonomous Triage'}</span>
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter optional description or use the voice button above. The AI multi-agent will automatically categorize, title, and prioritize your complaint..."
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* AI Autonomous Classification Preview */}
          {aiPreview && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Cpu className="w-4 h-4" />
                <span>Autonomous Agent Classification Detected</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">AI Generated Title:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{aiPreview.title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Identified Asset:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{aiPreview.affected_asset}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Auto-Category:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">{aiPreview.suggested_category}</span>
                </div>
              </div>
            </div>
          )}

          {/* Photograph Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Upload Photographs (Evidence)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700">
                <Image className="w-4 h-4 text-emerald-600" />
                <span>Choose Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">
                {imageUrls.length} photograph(s) attached
              </span>
            </div>

            {imageUrls.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Location Pin Picker */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Precise Location Pin
              </h3>
              <p className="text-[11px] text-slate-500">
                Click anywhere on the map to place the pinpoint marker.
              </p>
            </div>
            {pickedPos && (
              <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {pickedPos.lat.toFixed(4)}, {pickedPos.lng.toFixed(4)}
              </span>
            )}
          </div>

          <LocalityMap
            height="320px"
            center={[pickedPos?.lat || 12.9352, pickedPos?.lng || 77.6245]}
            zoom={16}
            isPickerMode={true}
            pickedPosition={pickedPos}
            onPickPosition={(latlng) => setPickedPos(latlng)}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? 'Multi-Agent Orchestrator Processing...' : 'Submit Complaint to NagarAI'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
