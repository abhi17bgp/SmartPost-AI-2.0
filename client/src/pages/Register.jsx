import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const res = await toast.promise(
        register({ name, email, password, passwordConfirm: confirmPassword }),
        {
          loading: 'Creating account...',
          success: 'Registration successful!',
          error: (err) => err.response?.data?.message || 'Registration failed. Please try again.'
        }
      );
      setSuccessMsg(res.data.message || 'Registration Successful! Check your email to verify your account.');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // We do not immediately redirect, wait for user to verify email
    } catch (err) {
      // Handled by toast.promise
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2 tracking-tight">Create Account</h1>
          <p className="text-slate-400">Join SmartPost <span className="text-emerald-400 font-medium">AI</span> to start testing.</p>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-6 rounded-lg mb-6 text-center shadow-inner">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
            </div>
            <p className="font-semibold text-lg mb-2 text-emerald-400">{successMsg}</p>
            <p className="text-sm text-emerald-500/80 mb-6">You must click the secure link in your email before you can sign in to your new workspace.</p>
            <Link to="/login" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-8 rounded-lg transition-colors shadow-md shadow-emerald-500/20">
              Go to Login
            </Link>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Full Name</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
                placeholder="John Doe"
              />
            </div>
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
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
              <input 
                type="password" 
                required
                minLength="8"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
                placeholder="•••••••• (Min 8 characters)"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Confirm Password</label>
              <input 
                type="password" 
                required
                minLength="8"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" 
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center mt-4 disabled:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-md shadow-emerald-500/20"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}

        {!successMsg && (
          <p className="text-center text-slate-400 text-sm mt-8">
            Already have an account? <Link to="/login" className="text-emerald-400 font-medium hover:text-emerald-300 ml-1 transition-colors">Sign in</Link>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Register;
