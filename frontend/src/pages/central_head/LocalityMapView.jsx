import React, { useState, useEffect } from 'react';
import { LocalityMap } from '../../components/LocalityMap';
import { apiFetch } from '../../utils/api';
import { Map, Layers, RefreshCw } from 'lucide-react';

export const LocalityMapView = () => {
  const [complaints, setComplaints] = useState([]);
  const [streets, setStreets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/map/complaints');
      setComplaints(res.features || []);
      const sSum = await apiFetch('/map/street-summary');
      setStreets(sSum || []);
    } catch (err) {
      console.warn('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-emerald-600" />
            Interactive Greenfield GIS Map
          </h1>
          <p className="text-xs text-slate-500">
            Locality-wide visual telemetry across all 6 street corridors with live priority markers
          </p>
        </div>
        <button
          onClick={loadMapData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <LocalityMap
        height="640px"
        complaints={complaints}
        streetSummary={streets}
        center={[12.9352, 77.6245]}
        zoom={16}
      />
    </div>
  );
};
