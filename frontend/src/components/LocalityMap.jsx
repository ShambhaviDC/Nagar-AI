import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { MapPin, Navigation, Eye, User, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle pin clicking when user picks location
function LocationPickerMarker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      if (onPositionChange) {
        onPositionChange(e.latlng);
      }
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Selected Complaint Geo-Point</Popup>
    </Marker>
  ) : null;
}

export const LocalityMap = ({
  complaints = [],
  streetSummary = [],
  selectedStreetId = null,
  center = [12.9352, 77.6245],
  zoom = 15,
  isPickerMode = false,
  pickedPosition = null,
  onPickPosition = null,
  height = '500px',
}) => {
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredComplaints = complaints.filter(c => {
    if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
    if (filterStatus === 'ACTIVE' && ['resolved', 'verified'].includes(c.status)) return false;
    if (filterStatus === 'RESOLVED' && !['resolved', 'verified'].includes(c.status)) return false;
    return true;
  });

  const getMarkerRadius = (priority) => {
    switch (priority) {
      case 'P1': return 10;
      case 'P2': return 8;
      case 'P3': return 6;
      default: return 5;
    }
  };

  const getMarkerColor = (priority) => {
    switch (priority) {
      case 'P1': return '#EF4444'; // Red
      case 'P2': return '#F59E0B'; // Amber
      case 'P3': return '#3B82F6'; // Blue
      default: return '#10B981';   // Emerald
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Map Control Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Greenfield Locality GIS Map
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {filteredComplaints.length} Geo-Markers
          </span>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Priority:</span>
          {['ALL', 'P1', 'P2', 'P3', 'P4'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                filterPriority === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height }} className="relative w-full">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Interactive Picker Marker */}
          {isPickerMode && (
            <LocationPickerMarker
              position={pickedPosition}
              onPositionChange={onPickPosition}
            />
          )}

          {/* Render Complaints as Priority-Colored Markers */}
          {filteredComplaints.map(c => {
            if (!c.latitude || !c.longitude) return null;
            const color = getMarkerColor(c.priority);
            const radius = getMarkerRadius(c.priority);

            return (
              <CircleMarker
                key={c.id}
                center={[c.latitude, c.longitude]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.85,
                  color: '#FFFFFF',
                  weight: 2,
                }}
              >
                <Popup className="nagar-popup">
                  <div className="p-1 min-w-[200px] text-left">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">{c.complaint_code}</span>
                      <PriorityBadge priority={c.priority} size="sm" />
                    </div>
                    <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{c.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{c.description}</p>
                    
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Street:</span>
                        <span className="font-medium text-slate-700">{c.street_name || 'Greenfield'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Head:</span>
                        <span className="font-medium text-slate-700">{c.assigned_street_head_name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-400">Status:</span>
                        <StatusBadge status={c.status} size="sm" />
                      </div>
                    </div>

                    <Link
                      to={`/complaints/${c.id}`}
                      className="mt-2 block w-full py-1 text-center rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700"
                    >
                      Inspect Complaint
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Demo Data Disclaimer */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Illustrative demo coordinates positioned in Greenfield Locality, Bengaluru.
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> P1 Critical</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> P2 High</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> P3 Medium</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> P4 Low</span>
        </div>
      </div>
    </div>
  );
};
