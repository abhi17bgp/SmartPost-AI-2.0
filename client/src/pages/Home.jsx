import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Zap, Shield, ChevronRight, Activity, Workflow, CheckCircle, MousePointer2, Users, Search, Play, ChevronUp } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const floatAnimation = {
  y: [0, -15, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const pulseGlow = {
  scale: [1, 1.05, 1],
  opacity: [0.5, 0.8, 0.5],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    // Workflow Step Loop
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4500);
    
    // Scroll listener for Top Button
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-transparent overflow-hidden font-sans relative">
      {/* Animated Background Orbs */}
      <motion.div 
        animate={{...pulseGlow, x: [0, 20, 0], y: [0, -20, 0]}}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" 
      />
      <motion.div 
        animate={{...pulseGlow, x: [0, -30, 0], y: [0, 30, 0]}}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] -z-10 mix-blend-screen pointer-events-none" 
      />

      {/* Premium Floating Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-6 left-0 right-0 z-50 px-4 sm:px-6 flex justify-center pointer-events-none"
      >
        <div className="w-full max-w-5xl bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-full h-16 flex items-center justify-between px-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto transition-all hover:bg-slate-900/70 hover:border-emerald-500/30">
            {/* Logo Left */}
            <Link to="/" className="flex items-center gap-2 group w-1/4 min-w-max">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:scale-110 transition-all">
                <Bot size={20} />
              </div>
              <span className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight hidden sm:block">
                SmartPost AI
              </span>
            </Link>
            
            {/* Center Links */}
            <div className="hidden md:flex items-center justify-center gap-1 flex-1 relative bg-white/5 p-1 rounded-full border border-white/5">
              {[
                { name: 'Features', id: 'features' },
                { name: 'Workflow', id: 'workflow' },
                { name: 'Pricing', id: 'pricing' }
              ].map((link) => (
                <a 
                  key={link.id}
                  href={`#${link.id}`} 
                  onClick={(e) => scrollToSection(e, link.id)} 
                  className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-all duration-300 ease-out"
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* Right Buttons */}
            <div className="hidden md:flex items-center justify-end gap-2 w-1/4 min-w-max">
              <Link to="/login" className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors rounded-full hover:bg-white/5">
                Login
              </Link>
              <Link to="/register" className="relative group text-sm font-bold px-7 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 overflow-hidden flex items-center gap-2">
                <span className="relative z-10">Get Started</span>
                <ChevronRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </Link>
            </div>
            
            {/* Mobile Menu simple button placeholder */}
            <div className="md:hidden flex items-center justify-end gap-3 min-w-max">
               <Link to="/login" className="text-sm font-medium text-slate-300">Login</Link>
               <Link to="/register" className="text-sm font-medium px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950">
                Sign Up
              </Link>
            </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl relative">
          <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-300 text-sm font-medium mb-8 backdrop-blur-md">
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Sparkles size={16} /></motion.div> 
            Intelligently Test Your APIs
          </motion.div>
          
          {/* Animated Typing Header */}
          <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 min-h-[140px] flex flex-col justify-center">
            The next generation of <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 inline-block mt-2">
              <TypeAnimation
                sequence={[
                  'Intelligent API Testing',
                  2500,
                  'Automated Debugging',
                  2500,
                  'AI-Powered Generation',
                  2500,
                  'Secure Cloud Routing',
                  2500
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
              />
            </span>
          </motion.h1>

          <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Automate, analyze, and optimize your API endpoints seamlessly. Connect workspaces, run requests, and let our AI provide deep insights into your responses.
          </motion.p>
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
            <Link to="/register" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-xl shadow-emerald-500/20 group hover:shadow-emerald-500/40">
              Start Building Free <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')} className="flex items-center justify-center px-8 py-4 rounded-xl font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-md">
              See How It Works
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Enterprise Grade Capabilities</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to debug and track your endpoints, packed into a beautiful, lightning-fast interface.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Zap size={24} className="text-amber-400"/>, title: "Lightning Fast API Call Engine", desc: "Execute complex API workflows instantly with minimal latency." },
            { icon: <Bot size={24} className="text-emerald-400"/>, title: "Smart AI Auto-Analysis", desc: "Automatically analyze responses for security, performance, and best practices." },
            { icon: <Users size={24} className="text-indigo-400"/>, title: "Collaborative Workspaces", desc: "Work together in real-time within secure team environments safely." }
          ].map((feature, i) => (
            <motion.div 
               key={i} 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-50px" }}
               transition={{ delay: i * 0.2 }}
               whileHover={{ y: -5 }}
               className="p-8 rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-white/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all shadow-inner">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dynamic Workflow Section using Option 2 Liquid Mesh Background */}
      <section id="workflow" className="py-32 relative overflow-hidden">
        {/* The beautiful Liquid Flow Background behind just this section */}
        <motion.div
           animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
           transition={{ duration: 15, ease: "linear", repeat: Infinity }}
           className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 via-indigo-900/40 to-slate-900/80 bg-[length:200%_200%] opacity-80 -z-10"
        />
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[80px] border-y border-emerald-500/20 -z-10 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Left Side: Step Tracker */}
            <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="flex-1 w-full"
            >
              <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200 mb-6">Seamless Execution</h2>
              <p className="text-slate-300 mb-10 text-lg">Watch how SmartPost AI autonomously processes your data from start to finish with unmatched clarity.</p>
              <div className="space-y-6">
                {[
                  { icon: <Search />, title: "1. Provide API to Test", desc: "Simply enter your endpoint URL and parameters." },
                  { icon: <Activity />, title: "2. Analyze Performance", desc: "Our engine executes and monitors latency, size, and status." },
                  { icon: <Bot />, title: "3. AI Deep Analysis", desc: "AI automatically spots vulnerabilities and formatting errors." },
                  { icon: <Users />, title: "4. Collaborative Workspace", desc: "Instantly share results with your team in real-time." }
                ].map((step, i) => (
                  <div key={i} className={`flex gap-4 p-4 rounded-2xl transition-all duration-500 ${activeStep === i ? 'bg-white/10 border border-white/20 shadow-lg' : 'opacity-50 grayscale'}`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-500 ${activeStep === i ? 'bg-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-400'}`}>
                        {step.icon}
                      </div>
                    </div>
                    <div className="pt-1">
                      <h4 className={`text-xl font-medium transition-colors duration-500 ${activeStep === i ? 'text-white' : 'text-slate-300'}`}>{step.title}</h4>
                      <p className="text-slate-400 mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Right Side: The Dynamic Animated Screen */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="flex-1 w-full"
            >
              <div className="rounded-2xl bg-slate-900 border border-slate-700 shadow-[0_0_60px_rgba(16,185,129,0.15)] relative overflow-hidden backdrop-blur-xl h-[450px]">
                 {/* Window decorations */}
                 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"/>
                 <div className="flex gap-2 p-4 border-b border-slate-800/80 bg-slate-900/50">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80"/>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"/>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"/>
                 </div>
                 
                 {/* The Animated Viewport */}
                 <div className="p-6 relative h-full w-full">
                   <AnimatePresence mode="wait">
                     {/* STEP 0: User providing API */}
                     {activeStep === 0 && (
                       <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col justify-center gap-6">
                         <div className="flex gap-4">
                            <div className="w-24 h-12 bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center rounded-lg border border-emerald-500/30">GET</div>
                            <div className="flex-1 h-12 bg-slate-950 rounded-lg flex items-center px-4 font-mono text-slate-300 relative overflow-hidden border border-slate-700">
                               api.smartpost.com/v1/auth
                               <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-5 bg-emerald-400 ml-1" />
                            </div>
                         </div>
                         <motion.div 
                           animate={{ scale: [1, 1.02, 1], boxShadow: ["0px 0px 0px rgba(16,185,129,0)", "0px 0px 20px rgba(16,185,129,0.5)", "0px 0px 0px rgba(16,185,129,0)"] }} 
                           transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                           className="w-full h-12 bg-emerald-500 text-slate-950 font-bold flex items-center justify-center rounded-lg shadow-lg self-end"
                         >
                            <Play size={18} fill="currentColor" className="mr-2" /> SEND REQUEST
                         </motion.div>
                       </motion.div>
                     )}

                     {/* STEP 1: Analyze Performance */}
                     {activeStep === 1 && (
                       <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
                         <div className="flex justify-between items-end mb-8">
                           <div>
                             <p className="text-slate-400 text-sm font-medium mb-1">Status Code</p>
                             <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} type="spring" className="inline-block px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold rounded-lg text-2xl">
                               200 OK
                             </motion.div>
                           </div>
                           <div className="text-right">
                             <p className="text-slate-400 text-sm font-medium mb-1">Latency</p>
                             <div className="text-3xl font-mono text-white flex items-center">
                               <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>45</motion.span>
                               <span className="text-emerald-500 ml-1">ms</span>
                             </div>
                           </div>
                         </div>
                         <div className="space-y-4 space-w-full">
                            <p className="text-slate-400 text-sm font-medium mb-2">Analyzing Payload Structure...</p>
                            <div className="w-full bg-slate-800 rounded-full h-3">
                              <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, ease: "easeOut" }} className="bg-emerald-500 h-3 rounded-full" />
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3">
                              <motion.div initial={{ width: "0%" }} animate={{ width: "80%" }} transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }} className="bg-indigo-500 h-3 rounded-full" />
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3">
                              <motion.div initial={{ width: "0%" }} animate={{ width: "65%" }} transition={{ duration: 2, ease: "easeOut", delay: 0.4 }} className="bg-amber-500 h-3 rounded-full" />
                            </div>
                         </div>
                       </motion.div>
                     )}

                     {/* STEP 2: AI Analysis */}
                     {activeStep === 2 && (
                       <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-6 relative">
                         <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-500/20">
                           <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900">
                             <Bot size={24} />
                           </motion.div>
                           <div>
                             <h4 className="font-bold text-white">SmartPost AI Analysis</h4>
                             <p className="text-xs text-emerald-400 flex items-center gap-1"><Sparkles size={10}/> Analysis Complete</p>
                           </div>
                         </div>
                         <div className="space-y-3 font-mono text-sm">
                           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="text-emerald-300">
                             &gt; Structure validated against schema.
                           </motion.div>
                           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }} className="text-amber-300">
                             &gt; Warning: 'user_id' parameter lacks strong typing.
                           </motion.div>
                           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.9 }} className="text-emerald-300">
                             &gt; Security headers are properly configured.
                           </motion.div>
                           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.6 }} className="text-white mt-4 border-l-2 border-emerald-500 pl-3">
                             "The endpoint is healthy! Consider adding rate limiting to prevent abuse."
                           </motion.div>
                         </div>
                       </motion.div>
                     )}

                     {/* STEP 3: Collaborative Workspace */}
                     {activeStep === 3 && (
                       <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full relative bg-slate-950 rounded-xl border border-slate-700 p-4">
                         
                         <div className="flex justify-between border-b border-slate-800 pb-2 mb-4">
                           <span className="text-slate-400 font-medium text-sm">Team Activity</span>
                           <div className="flex -space-x-2">
                             <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-slate-900 border" />
                             <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-slate-900 border" />
                             <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 border" />
                           </div>
                         </div>

                         <div className="font-mono text-sm text-slate-500 space-y-2">
                           <div>{`{`}</div>
                           <div className="pl-4">"user": "active",</div>
                           <div className="pl-4">"permissions": ["read", "write"]</div>
                           <div>{`}`}</div>
                         </div>

                         {/* Mock Cursors from teammates */}
                         <motion.div 
                           animate={{ x: [0, 150, 50, 200, 0], y: [0, 100, 50, 150, 0] }}
                           transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                           className="absolute top-10 left-10 flex flex-col items-center pointer-events-none"
                         >
                           <MousePointer2 fill="#10b981" color="#022c22" size={24} className="-rotate-12 drop-shadow-lg" />
                           <span className="bg-emerald-500 text-[10px] text-slate-900 font-bold px-2 py-0.5 rounded shadow-lg -mt-1 ml-4">Alice</span>
                         </motion.div>

                         <motion.div 
                           animate={{ x: [200, 50, 120, 20, 200], y: [150, 20, 120, 50, 150] }}
                           transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                           className="absolute top-10 left-10 flex flex-col items-center pointer-events-none"
                         >
                           <MousePointer2 fill="#6366f1" color="#1e1b4b" size={24} className="-rotate-12 drop-shadow-lg" />
                           <span className="bg-indigo-500 text-[10px] text-slate-50 font-bold px-2 py-0.5 rounded shadow-lg -mt-1 ml-4">Bob (Typing...)</span>
                         </motion.div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Start instantly for free. No credit card required.</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="p-8 rounded-3xl bg-slate-800/40 backdrop-blur-xl border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Developer</h3>
            <p className="text-slate-400 mb-6">Perfect for individual developers.</p>
            <div className="text-4xl font-extrabold text-white mb-8">$0 <span className="text-lg font-normal text-slate-500">/ forever</span></div>
            <ul className="space-y-4 mb-8">
              {['Unlimited Workspaces', 'Basic AI Context', 'Local History', 'Standard Network Proxy'].map((item, i) => (
                <li key={i} className="flex gap-3 items-center text-slate-300">
                  <CheckCircle size={18} className="text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className="block w-full text-center py-3 rounded-xl font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
              Get Started Free
            </Link>
          </motion.div>

          {/* Pro Tier */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="p-8 rounded-3xl bg-gradient-to-b from-slate-800/80 to-slate-900 backdrop-blur-xl border border-emerald-500/30 relative overflow-hidden shadow-2xl shadow-emerald-500/10"
          >
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">Coming Soon</div>
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise AI</h3>
            <p className="text-slate-400 mb-6">For teams requiring deep analysis.</p>
            <div className="text-4xl font-extrabold text-white mb-8">$19 <span className="text-lg font-normal text-slate-500">/ month</span></div>
            <ul className="space-y-4 mb-8">
              {['Advanced AI Automation', 'Team Collaboration', 'CI/CD API Testing', 'Priority Support'].map((item, i) => (
                <li key={i} className="flex gap-3 items-center text-slate-300">
                  <CheckCircle size={18} className="text-emerald-500" /> {item}
                </li>
              ))}
            </ul>
            <button disabled className="block w-full text-center py-3 rounded-xl font-semibold bg-emerald-500/50 text-emerald-100 cursor-not-allowed border border-emerald-500/20">
              Join Waitlist
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10 bg-slate-950/50 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-emerald-400" />
            <span className="text-lg font-bold text-white tracking-wide">SmartPost AI</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} SmartPost API Tool. All rights reserved.</p>
          <div className="flex gap-4 text-slate-500">
            <Link to="/" className="hover:text-emerald-400 transition-colors text-sm">Privacy</Link>
            <Link to="/" className="hover:text-emerald-400 transition-colors text-sm">Terms</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors text-sm">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Scroll To Top Button */}
      <AnimatePresence>
        {showTopBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[100] w-12 h-12 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-slate-900 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] focus:outline-none"
            aria-label="Scroll to top"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
