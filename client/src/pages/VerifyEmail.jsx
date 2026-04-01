import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const hasFetched = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const res = await api.patch(`/auth/verifyEmail/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
        toast.success('Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
        toast.error('Verification failed');
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#070b14] relative overflow-hidden font-sans">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-10 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.05)] text-center transition-all duration-500 hover:shadow-[0_0_80px_rgba(16,185,129,0.1)] hover:border-slate-600/50">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="w-20 h-20 bg-slate-800/80 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-lg relative">
                <svg className="animate-spin h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-3">Verifying...</h1>
              <p className="text-slate-400">Please wait while we validate your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 ring-1 ring-white/20 transform hover:scale-105 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 mb-3 tracking-tight">Email Verified!</h1>
              <p className="text-slate-300 font-medium mb-8">{message}</p>
              
              <Link to="/login" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all shadow-xl shadow-emerald-500/20 ring-1 ring-white/10 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5">
                Sign In to SmartPost AI
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-rose-500/30 ring-1 ring-white/20">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-200 mb-3 tracking-tight">Verification Failed</h1>
              <p className="text-rose-200/80 mb-8 max-w-[250px] mx-auto">{message}</p>
              
              <Link to="/register" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all shadow-lg ring-1 ring-slate-600 hover:ring-slate-500">
                Back to Registration
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
