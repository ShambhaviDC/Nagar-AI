import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotificationsPage } from './pages/NotificationsPage';

import { ResidentDashboard } from './pages/resident/ResidentDashboard';
import { RegisterComplaint } from './pages/resident/RegisterComplaint';
import { MyComplaints } from './pages/resident/MyComplaints';
import { StreetFeed } from './pages/resident/StreetFeed';
import { ComplaintDetail } from './pages/resident/ComplaintDetail';

import { StreetHeadDashboard } from './pages/street_head/StreetHeadDashboard';
import { StreetComplaints } from './pages/street_head/StreetComplaints';
import { WorkerManagement } from './pages/street_head/WorkerManagement';

import { CentralDashboard } from './pages/central_head/CentralDashboard';
import { LocalityMapView } from './pages/central_head/LocalityMapView';
import { StreetPerformance } from './pages/central_head/StreetPerformance';
import { EscalationsView } from './pages/central_head/EscalationsView';
import { LocalityAnalytics } from './pages/central_head/LocalityAnalytics';
import { AllComplaints } from './pages/central_head/AllComplaints';

// Layout wrapper for authenticated pages
const AppLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-400">
        Authenticating NagarAI Portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Routes */}
            <Route element={<AppLayout />}>
              {/* Resident */}
              <Route path="/resident" element={<ResidentDashboard />} />
              <Route path="/resident/new-complaint" element={<RegisterComplaint />} />
              <Route path="/resident/street-feed" element={<StreetFeed />} />
              <Route path="/resident/my-complaints" element={<MyComplaints />} />

              {/* Street Head */}
              <Route path="/street-head" element={<StreetHeadDashboard />} />
              <Route path="/street-head/complaints" element={<StreetComplaints />} />
              <Route path="/street-head/workers" element={<WorkerManagement />} />

              {/* Central Head */}
              <Route path="/central" element={<CentralDashboard />} />
              <Route path="/central/all-complaints" element={<AllComplaints />} />
              <Route path="/central/performance" element={<StreetPerformance />} />
              <Route path="/central/escalations" element={<EscalationsView />} />
              <Route path="/central/analytics" element={<LocalityAnalytics />} />

              {/* Shared Map & Details */}
              <Route path="/map" element={<LocalityMapView />} />
              <Route path="/complaints/:id" element={<ComplaintDetail />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
