import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/axiosInstance';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await toast.promise(
        login({ email, password }),
        {
          loading: 'Signing in...',
          success: 'Successfully logged in!',
          error: (err) => err.response?.data?.message || 'Login failed. Provide valid credentials.'
        }
      );
      navigate('/dashboard');
    } catch (err) {
      // Handled by toast.promise
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email first to reset your password.");
      return;
    }
    
    try {
      await toast.promise(
        api.post('/auth/forgotPassword', { email }),
        {
          loading: 'Sending reset link...',
          success: 'Password reset link sent to your email!',
          error: (err) => err.response?.data?.message || 'Failed to send reset link.'
        }
      );
    } catch (err) {
      // Handled by toast.promise
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-transparent relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] -z-10 pointer-events-none" />

      <div className="absolute top-8 left-8 z-20">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Home
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-800/40 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 mx-4 z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-slate-400">Sign in to SmartPost <span className="text-emerald-400 font-medium">AI</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5 align-middle">
              <label className="block text-slate-300 text-sm font-medium">Password</label>
              <a href="#" onClick={handleForgotPassword} className="text-xs text-emerald-500 hover:text-emerald-400 focus:outline-none">Forgot password?</a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center mt-2 disabled:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-md shadow-emerald-500/20"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-8">
          Don't have an account? <Link to="/register" className="text-emerald-400 font-medium hover:text-emerald-300 ml-1 transition-colors">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
