import React, { useState } from 'react';
import { Activity, Play, Settings, Server, Clock, ServerCog, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useWorkspace } from '../context/WorkspaceContext';

const PerformanceAnalyzer = ({ activeReqTab, onClose }) => {
  const { currentWorkspace, latestHistoryId } = useWorkspace();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [runs, setRuns] = useState(5);
  const [testType, setTestType] = useState('sequential');
  const [progress, setProgress] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  const startTest = async () => {
    if (!activeReqTab || !activeReqTab.url) {
      toast.error('No valid request to test.');
      return;
    }

    setIsRunning(true);
    setHasRun(false);
    setResults([]);
    setProgress(0);

    let finalResults = [];

    // Exact logic from RequestPane to prepare the request
    const activeHeaders = activeReqTab.headers.reduce((acc, curr) => {
      if (curr.isActive && curr.key) acc[curr.key] = curr.value;
      return acc;
    }, {});

    const activeParams = activeReqTab.queryParams.reduce((acc, curr) => {
      if (curr.isActive && curr.key) acc[curr.key] = curr.value;
      return acc;
    }, {});

    let finalUrl = activeReqTab.url;
    if (Object.keys(activeParams).length > 0) {
      try {
        const urlObj = new URL(finalUrl.startsWith('http') ? finalUrl : `https://${finalUrl}`);
        Object.entries(activeParams).forEach(([k, v]) => urlObj.searchParams.append(k, v));
        finalUrl = urlObj.toString();
      } catch (e) {
        finalUrl = activeReqTab.url;
      }
    }

    let parsedBody = null;
    if ((activeReqTab.method === 'POST' || activeReqTab.method === 'PUT' || activeReqTab.method === 'PATCH') && activeReqTab.body.mode === 'json') {
      try {
        parsedBody = JSON.parse(activeReqTab.body.content);
      } catch (e) {
        parsedBody = activeReqTab.body.content;
      }
    }

    // Run tests
    if (testType === 'sequential') {
      for (let i = 1; i <= runs; i++) {
        try {
          const startTime = Date.now();
          const res = await api.post('/proxy', {
            url: finalUrl,
            method: activeReqTab.method,
            headers: activeHeaders,
            data: parsedBody
          });
          const timeTaken = res.data.data.timeTaken || (Date.now() - startTime);
          finalResults.push({ run: i, time: timeTaken, error: false });
        } catch (err) {
          finalResults.push({ run: i, time: null, error: true });
        }

        setResults([...finalResults]);
        setProgress(Math.round((i / runs) * 100));
      }
    } else {
      // Parallel execution
      finalResults = Array.from({ length: runs }).map((_, i) => ({ run: i + 1, pending: true }));
      setResults([...finalResults]);

      const promises = Array.from({ length: runs }).map(async (_, i) => {
        const runIndex = i + 1;
        try {
          const startTime = Date.now();
          const res = await api.post('/proxy', {
            url: finalUrl,
            method: activeReqTab.method,
            headers: activeHeaders,
            data: parsedBody
          });
          const timeTaken = res.data.data.timeTaken || (Date.now() - startTime);
          return { run: runIndex, time: timeTaken, error: false };
        } catch (err) {
          return { run: runIndex, time: null, error: true };
        }
      });

      let completed = 0;
      const wrappedPromises = promises.map((p, i) => p.then(res => {
        completed++;
        finalResults[i] = res;
        setResults([...finalResults]);
        setProgress(Math.round((completed / runs) * 100));
        return res;
      }));

      await Promise.all(wrappedPromises);
    }

    setIsRunning(false);
    setHasRun(true);

    // Calculate metrics to save securely using the synchronous array
    const validResults = finalResults.filter(r => !r.error && !r.pending && r.time !== null);
    
    let avg = 0, currentMin = 0, currentMax = 0, errCount = finalResults.filter(r => r.error).length;
    if (validResults.length > 0) {
      const total = validResults.reduce((acc, r) => acc + r.time, 0);
      avg = Math.round(total / validResults.length);
      currentMax = Math.max(...validResults.map(r => r.time));
      currentMin = Math.min(...validResults.map(r => r.time));
    }

    const stable = errCount === 0 && (validResults.length < 2 || (currentMax - currentMin) < Math.max(50, avg * 0.15));

    // Save performance history to the exact same history row
    if (currentWorkspace) {
      try {
        const histId = latestHistoryId[activeReqTab.id];
        const payload = {
          isPerformanceRun: true,
          performanceMetrics: {
            runs,
            testType,
            average: avg,
            min: currentMin,
            max: currentMax,
            errorCount: errCount,
            isStable: stable
          }
        };

        if (histId) {
          // UNIFY: Update the existing history record
          await api.patch(`/history/${histId}`, payload);
        } else {
          // FALLBACK: Create a new history record if one doesn't exist
          await api.post('/history', {
            workspaceId: currentWorkspace._id,
            method: activeReqTab.method,
            url: finalUrl,
            status: errCount === 0 ? 200 : 500,
            timeTaken: avg,
            ...payload
          });
        }
      } catch (err) {
        console.error('Failed to save performance run history', err);
      }
    }
  };

  const getAverage = () => {
    const validResults = results.filter(r => !r.error && !r.pending && r.time !== null);
    if (validResults.length === 0) return 0;
    const total = validResults.reduce((acc, r) => acc + r.time, 0);
    return Math.round(total / validResults.length);
  };

  const averageTime = getAverage();

  const getMinMax = () => {
    const validResults = results.filter(r => !r.error && !r.pending && r.time !== null);
    if (validResults.length === 0) return { min: 0, max: 0 };
    const max = Math.max(...validResults.map(r => r.time));
    const min = Math.min(...validResults.map(r => r.time));
    return { min, max };
  };
  const { min, max } = getMinMax();

  const errorCount = results.filter(r => r.error).length;

  const isStable = () => {
    if (errorCount > 0) return false;
    const validResults = results.filter(r => !r.error && !r.pending && r.time !== null);
    if (validResults.length < 2) return true;
    
    // Stricter heuristic: max delta < 15% of average or 50ms
    return (max - min) < Math.max(50, averageTime * 0.15);
  };

  let statusColor = 'text-emerald-400';
  let badgeClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
  let statusText = 'Excellent';
  let Icon = Server;

  if (errorCount > 0) {
    statusColor = 'text-red-400';
    badgeClass = 'bg-red-500/20 border-red-500/50 text-red-400';
    statusText = 'Failing';
  } else if (averageTime > 800) {
    statusColor = 'text-red-400';
    badgeClass = 'bg-red-500/20 border-red-500/50 text-red-400';
    statusText = 'Poor';
  } else if (averageTime >= 300) {
    statusColor = 'text-amber-400';
    badgeClass = 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    statusText = 'Good';
  }

  // Actionable Suggestions
  const renderSuggestions = () => {
    // Only show suggestions AFTER the run is fully complete
    if (!hasRun || isRunning || results.length !== runs) return null;

    const suggestions = [];
    if (errorCount > 0) {
      suggestions.push({
        title: "Fix API Errors",
        desc: `Test resulted in ${errorCount} error(s). Review backend logs to resolve failing requests before optimizing for speed.`
      });
    }
    
    if (!isStable() && errorCount === 0) {
      suggestions.push({
        title: "Address API Instability",
        desc: "Response times are highly variable. Check for resource bottlenecks, background tasks, or database locking issues."
      });
    }

    if (averageTime > 300 && errorCount === 0) {
      suggestions.push({
        title: "Implement Caching Layer",
        desc: "Add a caching mechanism (Redis, Memcached) to returning frequent API responses instantly."
      });
      suggestions.push({
        title: "Optimize Database Queries",
        desc: "Ensure your backend uses indexing properly and eliminate unnecessary joins or N+1 queries."
      });
      suggestions.push({
        title: "Reduce Payload Size",
        desc: "Strip out large, unnecessary fields from the JSON payload. Compress responses using Gzip or Brotli."
      });
    } else if (isStable() && errorCount === 0 && averageTime > 0) {
      suggestions.push({
        title: "Looking Good!",
        desc: "Your API is stable and responds well. Keep up the good work and monitor closely as traffic scales."
      });
    }

    return (
      <div className="mt-6 border border-slate-700/50 rounded-xl bg-slate-800/50 p-4 animate-fade-in">
        <h4 className="flex items-center gap-2 font-bold text-slate-200 mb-4">
          <Lightbulb size={16} className="text-amber-400" /> Actionable Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suggestions.map((s, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-700/50 p-3 rounded-lg flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-300">{s.title}</span>
              <span className="text-xs text-slate-500 leading-relaxed">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0f1423] rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      {/* Header controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
        <div>
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 tracking-tight">
            <Activity className="text-indigo-400" size={20} /> API Performance Analyzer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Stress test your endpoints to ensure stable response times.</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1" title="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 w-full overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
          <div className="flex flex-nowrap items-center gap-3 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 w-full sm:w-auto min-w-max">
            <div className="flex items-center pl-2 gap-1.5 text-xs font-mono text-slate-400 shrink-0">
              <Settings size={14} /> Type:
            </div>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded cursor-pointer px-2 py-1 outline-none focus:border-indigo-500 shrink-0"
              value={testType}
              onChange={e => setTestType(e.target.value)}
              disabled={isRunning}
            >
              <option value="sequential">Sequential</option>
              <option value="parallel">Parallel</option>
            </select>

            <div className="w-px h-5 bg-slate-700 shrink-0"></div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 shrink-0">
              Runs:
            </div>
            <select
              className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded cursor-pointer px-2 py-1 outline-none focus:border-indigo-500 shrink-0"
              value={runs}
              onChange={e => setRuns(Number(e.target.value))}
              disabled={isRunning}
            >
              <option value={5}>5 Requests</option>
              <option value={10}>10 Requests</option>
              <option value={15}>15 Requests</option>
              <option value={20}>20 Requests</option>
            </select>
            <button
              onClick={startTest}
              disabled={isRunning}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-1.5 rounded flex-shrink-0 flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {isRunning ? (
                <span className="animate-pulse flex items-center gap-1.5"><Activity size={14} /> Running...</span>
              ) : (
                <span className="flex items-center gap-1.5"><Play size={14} fill="currentColor" /> Start Test</span>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Results Region */}
        {results.length > 0 && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-stretch gap-4 flex-col lg:flex-row">

              {/* Stats Card */}
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 shrink-0 w-full lg:w-64 flex flex-col justify-center relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-2 relative z-10">
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Average Latency</span>
                    <Clock size={16} className="text-slate-500" />
                  </div>
                  <div className="flex items-baseline gap-1 relative z-10">
                    <span className={`text-3xl font-black ${statusColor} font-mono tracking-tighter`}>{averageTime}</span>
                    <span className="text-slate-500 font-bold ml-1 text-sm">ms</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 relative z-10 border-t border-slate-700/50 pt-3">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Min</span>
                    <div className="text-emerald-400 font-mono text-sm">{min > 0 ? `${min}ms` : '--'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Max</span>
                    <div className="text-amber-400 font-mono text-sm">{max > 0 ? `${max}ms` : '--'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Errors</span>
                    <div className={`font-mono text-sm ${errorCount > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                      {errorCount}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between relative z-10 border-t border-slate-700/50 pt-3">
                  <span className="text-slate-400 text-xs font-bold">Stability:</span>
                  <span className={`text-xs font-bold ${isStable() ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isStable() ? 'Stable ✅' : 'Unstable ⚠️'}
                  </span>
                </div>

                <div className={`mt-2 w-full justify-center px-3 py-1.5 rounded border text-xs font-bold flex items-center gap-1.5 ${badgeClass} relative z-10`}>
                  <Activity size={12} /> {statusText} Performance
                </div>
              </div>

              {/* Chart Area */}
              <div className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 min-h-[250px]">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Response Time Trend</h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="run"
                        stroke="#475569"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `Req ${val}`}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}ms`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                        formatter={(value) => [`${value}ms`, 'Time']}
                        labelFormatter={(label) => `Request #${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="time"
                        stroke="#818cf8"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#818cf8' }}
                        animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {renderSuggestions()}
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isRunning && (
          <div className="flex flex-col items-center justify-center h-48 opacity-60">
            <ServerCog size={40} className="text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-1">No Test Data</h3>
            <p className="text-slate-500 text-sm">Select your run count and click "Start Test" to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAnalyzer;
