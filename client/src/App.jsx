import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { DialogProvider } from './context/DialogContext';
import BackgroundParticles from './components/BackgroundParticles';

import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <div className="min-h-screen relative text-slate-50 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
            <BackgroundParticles />
            <Toaster position="top-right" toastOptions={{
              style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', zIndex: 9999 },
            }} />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <WorkspaceProvider>
                      <Dashboard />
                    </WorkspaceProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
