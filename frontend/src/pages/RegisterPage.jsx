import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NagarLogo } from '../components/NagarLogo';
import { Mail, Lock, User, Phone, MapPin, ArrowRight, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

const FALLBACK_STREETS = [
  { id: 'MGR-01', code: 'MGR-01', name: 'MG Road (Mahatma Gandhi Road)', locality_id: 'default' },
  { id: 'BRG-02', code: 'BRG-02', name: 'Brigade Road', locality_id: 'default' },
  { id: 'NHR-03', code: 'NHR-03', name: 'Nehru Marg', locality_id: 'default' },
  { id: 'STN-04', code: 'STN-04', name: 'Station Road', locality_id: 'default' },
  { id: 'MKT-05', code: 'MKT-05', name: 'Market Street', locality_id: 'default' },
  { id: 'TMP-06', code: 'TMP-06', name: 'Temple Road', locality_id: 'default' },
  { id: 'PRK-07', code: 'PRK-07', name: 'Park Avenue', locality_id: 'default' },
  { id: 'HSP-08', code: 'HSP-08', name: 'Hospital Road', locality_id: 'default' },
];

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [streets, setStreets] = useState(FALLBACK_STREETS);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    street_id: FALLBACK_STREETS[0].id,
    locality_id: 'default',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStreets = async () => {
      try {
        const data = await apiFetch('/streets');
        if (Array.isArray(data) && data.length > 0) {
          setStreets(data);
          setFormData(prev => ({
            ...prev,
            street_id: data[0].id || data[0].code,
            locality_id: data[0].locality_id || 'default',
          }));
        }
      } catch (err) {
        console.warn('Using default common Indian streets:', err);
      }
    };
    loadStreets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'street_id') {
      const match = streets.find(s => s.id === value || s.code === value);
      if (match && match.locality_id) {
        setFormData(prev => ({ ...prev, locality_id: match.locality_id }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        ...formData,
        role: 'resident',
      });
      navigate('/resident');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex justify-center mb-6">
          <NagarLogo size="lg" showTagline={true} />
        </div>

        <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white">
          Resident Registration
        </h2>
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1 mb-6">
          Connect your household to Greenfield Locality civic services
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ramesh Kumar"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh@gmail.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Your Street
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                name="street_id"
                required
                value={formData.street_id}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                {streets.map(s => (
                  <option key={s.id || s.code} value={s.id || s.code}>
                    {s.name} ({s.code || 'Street'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
