import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-emerald-500">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  
  return children;
};

export default ProtectedRoute;
