import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, Wrench, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export const WorkerManagement = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: 'Electrical Maintenance',
    skills: 'Streetlights, Cabling',
  });

  const departments = [
    "Electrical Maintenance",
    "Electrical Power & Grid",
    "Water Works & Pipeline",
    "Sewerage & Drainage",
    "Solid Waste Management",
    "Civil Works & Paving",
    "Health & Sanitation",
    "Public Works"
  ];

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/street-head/workers');
      setWorkers(data);
    } catch (err) {
      console.warn('Failed to load workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/street-head/workers', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          department: formData.department,
          locality_id: 'default',
          skills: formData.skills.split(',').map(s => s.trim()),
          status: 'available',
          active_tasks_count: 0,
        }),
      });
      setShowAddModal(false);
      await loadWorkers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Locality Maintenance Fleet
          </h1>
          <p className="text-xs text-slate-500">
            Workforce roster, skill departments, and active task distribution
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Maintenance Worker</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map(w => (
          <div
            key={w.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{w.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                w.status === 'available'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {w.status}
              </span>
            </div>

            <div className="text-xs text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>{w.department}</span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{w.phone}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Workload:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {w.active_tasks_count} active tickets
              </span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Enroll Maintenance Technician
            </h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Technician Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Anand Shinde"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                  required
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98000 00000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
