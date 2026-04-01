import React, { useState, useEffect } from 'react';
import { Copy, Check, FileJson, Clock, Server, MonitorDown, Sparkles, Loader2, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import api from '../utils/axiosInstance';
import { useWorkspace } from '../context/WorkspaceContext';
import PerformanceAnalyzer from './PerformanceAnalyzer';

const ResponsePane = ({ data, loading }) => {
  const { tabs, activeTabId, responseAi, setResponseAi, responseAiLoading, setResponseAiLoading, latestHistoryId, fetchHistory, fetchCollections } = useWorkspace();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('Body');
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  const activeReqTab = tabs.find(t => t.id === activeTabId);

  const aiAnalysis = responseAi[activeTabId] || null;
  const aiLoading = responseAiLoading[activeTabId] || false;

  // Automatically clear the AI analysis when a new request starts loading
  useEffect(() => {
    if (loading) {
      setResponseAi(prev => ({ ...prev, [activeTabId]: null }));
      setResponseAiLoading(prev => ({ ...prev, [activeTabId]: false }));
      if (activeTab === 'AI Analysis') {
        setActiveTab('Body');
      }
    }
  }, [loading, activeTab, activeTabId, setResponseAi, setResponseAiLoading]);

  const handleAnalyze = async () => {
    if (!data) return;
    setActiveTab('AI Analysis');
    setResponseAiLoading(prev => ({ ...prev, [activeTabId]: true }));
    setResponseAi(prev => ({ ...prev, [activeTabId]: null }));
    try {
      const res = await api.post('/ai/analyze', {
        status: data.status,
        data: data.data,
        headers: data.headers,
        timeTaken: data.timeTaken,
        url: activeReqTab?.url,
        method: activeReqTab?.method
      });
      const analysisText = res.data.data.analysis;
      setResponseAi(prev => ({ ...prev, [activeTabId]: analysisText }));

      // Auto-save the AI Analysis permanently if this is a saved request from a collection
      if (activeTabId.startsWith('req_')) {
        const reqId = activeTabId.replace('req_', '');
        api.patch(`/requests/${reqId}`, { aiAnalysis: analysisText })
          .then(() => fetchCollections?.())
          .catch(err => console.error("Auto-save AI failed:", err));
      }

      // Auto-save the AI Analysis to the global history log
      const histId = latestHistoryId?.[activeTabId];
      if (histId) {
        api.patch(`/history/${histId}`, { aiAnalysis: analysisText })
          .then(() => fetchHistory?.())
          .catch(err => console.error("History auto-save AI failed:", err));
      }

      toast.success("Analysis complete!");
    } catch (err) {
      toast.error('AI Analysis failed: ' + (err.response?.data?.message || err.message));
      setResponseAi(prev => ({ ...prev, [activeTabId]: '**Failed to load analysis.** Please ensure your `GEMINI_API_KEY` is configured correctly in `server/.env` and restart the backend.' }));
    } finally {
      setResponseAiLoading(prev => ({ ...prev, [activeTabId]: false }));
    }
  };

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-slate-500';
    if (status >= 200 && status < 300) return 'text-emerald-500';
    if (status >= 300 && status < 400) return 'text-blue-500';
    if (status >= 400 && status < 500) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 border-l border-slate-700/50">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-t-2 border-slate-600 animate-spin animation-delay-150"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
        <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse tracking-widest uppercase">Sending Request</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 border-l border-slate-700/50">
        <div className="w-20 h-20 mb-6 text-slate-700">
          <MonitorDown size={80} strokeWidth={1} />
        </div>
        <h3 className="text-xl font-medium text-slate-400 mb-2 tracking-tight">Ready to Send</h3>
        <p className="text-slate-500 text-sm max-w-xs text-center">Hit the Send button to execute the request and see the response here.</p>
      </div>
    );
  }

  const prettyJsonSrc = typeof data.data === 'string'
    ? data.data
    : JSON.stringify(data.data, null, 2);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700/50">
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 backdrop-blur shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Status</span>
            <span className={`font-mono text-sm font-bold ${getStatusColor(data.status)} flex items-center gap-1.5`}>
              {data.status} <span className="font-sans text-xs opacity-80">{data.statusText}</span>
            </span>
          </div>
          <div className="w-[1px] h-5 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Time</span>
            <span className="font-mono text-sm text-emerald-400/90 font-bold">{data.timeTaken}<span className="text-emerald-600 font-medium text-xs ml-0.5">ms</span></span>
          </div>
          <div className="w-[1px] h-5 bg-slate-700 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1"><Server size={12} /> Size</span>
            <span className="font-mono text-sm text-slate-300 font-medium">{prettyJsonSrc?.length > 1024 ? (prettyJsonSrc.length / 1024).toFixed(2) + ' KB' : prettyJsonSrc?.length + ' B'}</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-800 shrink-0 px-2 mt-1 justify-between items-end">
        <div className="flex">
          {['Body', 'Headers', 'AI Analysis'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-xs font-medium transition-all relative ${activeTab === t ? (t === 'AI Analysis' ? 'text-purple-400' : 'text-emerald-400') : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'} ${t === 'AI Analysis' && activeTab !== t ? 'hover:text-purple-300' : ''}`}
            >
              <div className="flex items-center gap-1.5">
                {t === 'AI Analysis' && <Sparkles size={12} className={activeTab === t ? 'text-purple-400' : 'text-purple-500/60'} />}
                {t}
              </div>
              {activeTab === t && <div className={`absolute bottom-0 left-0 w-full h-[2px] ${t === 'AI Analysis' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'}`} />}
            </button>
          ))}
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setShowPerformanceModal(true)}
            className="mb-1 mr-2 text-xs font-bold px-3 py-1.5 rounded-md text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all border border-indigo-500/20"
            title="Run Performance Tests"
          >
            <Activity size={12} /> Test API
          </button>
          <button
            onClick={handleAnalyze}
            disabled={aiLoading}
            className="mb-1 mr-2 text-xs font-bold px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transform transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed border border-purple-400/30"
            title="Analyze response using SmartPost AI"
          >
            {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Analyze ✨
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#0a0f1d] relative group">
        {activeTab === 'Body' && (
          <>
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-md opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-slate-600/50 shadow-lg z-10"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
            <pre className="p-4 m-0 font-mono text-[13px] leading-relaxed text-[#c3e88d] whitespace-pre-wrap break-all custom-scrollbar h-full">
              {typeof data.data === 'string'
                ? (data.data.startsWith('<') ? <span className="text-[#f07178] opacity-80">{data.data} // HTML returned</span> : <span className="text-[#eeffff]">{data.data}</span>)
                : prettyJsonSrc}
            </pre>
          </>
        )}

        {activeTab === 'Headers' && (
          <div className="p-4 grid grid-cols-[1fr_2fr] gap-x-4 gap-y-2 font-mono text-xs max-w-3xl">
            {Object.entries(data.headers || {}).map(([key, value]) => (
              <React.Fragment key={key}>
                <div className="text-slate-400 border-b border-slate-800/50 py-1.5 break-all">{key}</div>
                <div className="text-emerald-400 border-b border-slate-800/50 py-1.5 break-all">{value}</div>
              </React.Fragment>
            ))}
          </div>
        )}

        {activeTab === 'AI Analysis' && (
          <div className="p-6 h-full overflow-y-auto custom-scrollbar bg-[#0f1423]">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center h-full opacity-80 animate-fade-in">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <Sparkles size={48} className="text-purple-400 animate-pulse relative z-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2 tracking-tight">SmartPost AI is analyzing...</h3>
                <p className="text-indigo-200/60 text-sm font-medium">Scanning payload, headers, and status code</p>
              </div>
            ) : aiAnalysis ? (
              <div className="prose prose-invert prose-emerald max-w-none text-sm leading-relaxed prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-700/50 prose-a:text-purple-400 prose-headings:text-slate-200 prose-strong:text-purple-300 prose-code:text-emerald-300 animate-fade-in break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysis}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-60">
                <Sparkles size={40} className="text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-300 mb-1">No Analysis Yet</h3>
                <p className="text-slate-500 text-sm">Click the <strong className="text-purple-400">Analyze ✨</strong> button above to uncover insights.</p>
              </div>
            )}
          </div>
        )}

        {/* Performance Modal */}
        {showPerformanceModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl h-[85vh]">
              <PerformanceAnalyzer activeReqTab={activeReqTab} onClose={() => setShowPerformanceModal(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsePane;
