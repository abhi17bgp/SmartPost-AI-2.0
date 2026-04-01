import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
   
console.log(password === confirmPassword);

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await toast.promise(
        api.patch(`/auth/resetPassword/${token}`, { password }),
        {
          loading: 'Resetting password...',
          success: 'Password reset successful!',
          error: (err) => err.response?.data?.message || 'Token explicitly expired or invalid'
        }
      );
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // Handled by toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-transparent relative overflow-hidden font-sans">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-10 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.05)] transition-all duration-500 hover:shadow-[0_0_80px_rgba(16,185,129,0.1)] hover:border-slate-600/50">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 mb-6 shadow-xl shadow-emerald-500/30 ring-1 ring-white/20 transform transition-transform hover:scale-105 duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">Set New Password</h1>
            <p className="text-sm text-emerald-100/60 font-medium">Please enter your new desired security key below.</p>
          </div>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-2xl text-center transform transition-all animate-fade-in">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="font-semibold text-lg mb-2 text-white">Password Secured</p>
              <p className="text-sm text-emerald-500/70 mb-6">Your account is safe. Redirecting you to login...</p>
              <Link to="/login" className="inline-block w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/25 ring-1 ring-white/10 hover:shadow-emerald-500/40">
                Continue to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 ml-1 group-focus-within:text-emerald-400 transition-colors">New Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input 
                    type="password" 
                    required
                    minLength="8"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/50 text-slate-100 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono placeholder:font-sans placeholder:text-slate-600" 
                    placeholder="Minimal 8 characters"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 ml-1 group-focus-within:text-emerald-400 transition-colors">Confirm Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <input 
                    type="password" 
                    required
                    minLength="8"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/50 text-slate-100 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono placeholder:font-sans placeholder:text-slate-600" 
                    placeholder="Verify your new password"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all flex justify-center mt-6 disabled:opacity-70 disabled:grayscale focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-xl shadow-emerald-500/20 ring-1 ring-white/10 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating...
                  </span>
                ) : 'Confirm Password Reset'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
