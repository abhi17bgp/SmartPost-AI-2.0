import React, { useState } from 'react';
import { Send, Save, ChevronDown, X } from 'lucide-react';
import api from '../utils/axiosInstance';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';
import toast from 'react-hot-toast';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

const RequestPane = ({ setResponseData, setResponseLoading, tab }) => {
  const { fetchHistory, collections, fetchCollections, currentWorkspace, setTabs, setActiveTabId, responseData, responseAi, setLatestHistoryId, typingUsers, socket } = useWorkspace();
  const { user } = useAuth();
  const { prompt } = useDialog();
  const [method, setMethod] = useState(tab?.method || 'GET');
  const [url, setUrl] = useState(tab?.url || '');
  const [activeTab, setActiveTab] = useState('Params');

  // Save Request Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [requestName, setRequestName] = useState(tab?.title && tab.title !== 'Untitled Request' ? tab.title : '');
  const [selectedCollection, setSelectedCollection] = useState(tab?.collectionId || '');

  const [queryParams, setQueryParams] = useState(tab?.queryParams || [{ key: '', value: '', isActive: true }]);
  const [headers, setHeaders] = useState(tab?.headers || [{ key: '', value: '', isActive: true }]);
  const [bodyMode, setBodyMode] = useState(tab?.body?.mode || 'json');
  const [bodyContent, setBodyContent] = useState(tab?.body?.content || '{\n  \n}');

  // Update effect to reset state correctly when switching tabs
  React.useEffect(() => {
    setMethod(tab?.method || 'GET');
    setUrl(tab?.url || '');
    setQueryParams(tab?.queryParams || [{ key: '', value: '', isActive: true }]);
    setHeaders(tab?.headers || [{ key: '', value: '', isActive: true }]);
    setBodyMode(tab?.body?.mode || 'json');
    setBodyContent(tab?.body?.content || '{\n  \n}');
    setRequestName(tab?.title && tab.title !== 'Untitled Request' ? tab.title : '');
    setSelectedCollection(tab?.collectionId || '');
  }, [tab]);

  const handleTyping = () => {
    if (!socket || !currentWorkspace || !tab?.id) return;
    socket.emit('typing_request', {
      workspaceId: currentWorkspace._id,
      userName: user?.name,
      requestId: tab.id
    });
  };

  const handleSend = async () => {
    if (!url) return;
    setResponseLoading(true);
    setResponseData(null);

    try {
      // Process headers & params into objects
      const activeHeaders = headers.reduce((acc, curr) => {
        if (curr.isActive && curr.key) acc[curr.key] = curr.value;
        return acc;
      }, {});

      const activeParams = queryParams.reduce((acc, curr) => {
        if (curr.isActive && curr.key) acc[curr.key] = curr.value;
        return acc;
      }, {});

      // Combine URL with params if valid
      let finalUrl = url;
      if (Object.keys(activeParams).length > 0) {
        try {
          const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
          Object.entries(activeParams).forEach(([k, v]) => urlObj.searchParams.append(k, v));
          finalUrl = urlObj.toString();
        } catch (e) {
          // Ignore invalid URL parse issues for now
          finalUrl = url;
        }
      }

      let parsedBody = null;
      if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && bodyMode === 'json') {
        try {
          parsedBody = JSON.parse(bodyContent);
        } catch (e) {
          parsedBody = bodyContent; // fallback to string
        }
      }

      // We proxy everything through our backend to bypass CORS
      const res = await api.post('/proxy', {
        url: finalUrl,
        method,
        headers: activeHeaders,
        data: parsedBody
      });

      setResponseData(res.data.data);

      // Auto-save the response permanently if this is a saved request from a collection
      if (tab?.id?.startsWith('req_')) {
        const reqId = tab.id.replace('req_', '');
        api.patch(`/requests/${reqId}`, {
          lastResponse: {
            status: res.data.data.status,
            timeTaken: res.data.data.timeTaken,
            data: res.data.data.data,
            headers: res.data.data.headers
          }
        }).catch(err => console.error("Auto-save response failed:", err));
      }

      // Save history
      api.post('/history', {
        workspaceId: currentWorkspace?._id,
        method,
        url: finalUrl,
        status: res.data.data.status,
        timeTaken: res.data.data.timeTaken,
        headers,
        queryParams,
        bodyMode,
        bodyContent,
        responseData: res.data.data
      }).then((historyRes) => {
        if (historyRes.data?.data?.history?._id) {
          setLatestHistoryId(prev => ({ ...prev, [tab.id]: historyRes.data.data.history._id }));
        }
        fetchHistory();
      }).catch(() => { });

      // Sync active tab state to global context so PerformanceAnalyzer can access the fresh unsaved URL
      setTabs(prev => prev.map(t => t.id === tab.id ? {
        ...t,
        method,
        url: finalUrl,
        headers,
        queryParams,
        body: { mode: bodyMode, content: bodyContent }
      } : t));

    } catch (err) {
      setResponseData(err.response?.data?.data || {
        status: 0,
        statusText: 'Error',
        data: err.message,
        timeTaken: 0,
        headers: {}
      });
    } finally {
      setResponseLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    const name = await prompt("New Collection", "Enter a name for your new collection:", { placeholder: "e.g. Auth API" });
    if (!name) return;
    try {
      const res = await toast.promise(
        api.post('/collections', { name, workspaceId: currentWorkspace._id }).then(async (res) => {
          await fetchCollections();
          return res;
        }),
        {
          loading: 'Creating collection...',
          success: 'Collection created!',
          error: 'Failed to create collection'
        }
      );
      if (res.data?.data?.collection?._id) {
        setSelectedCollection(res.data.data.collection._id);
      } else if (res.data?.data?._id) {
        setSelectedCollection(res.data.data._id);
      }
    } catch (err) {
      // Handled by toast.promise
    }
  };

  const handleSaveRequest = async () => {
    if (!requestName || !selectedCollection) {
      toast.error('Please provide a name and select a collection');
      return;
    }

    try {
      const currentResponse = responseData[tab.id];
      const currentAi = responseAi[tab.id];

      const payload = {
        name: requestName,
        method,
        url,
        headers,
        queryParams,
        body: { type: bodyMode === 'json' ? 'json' : 'none', content: bodyContent },
        collectionId: selectedCollection,
        workspaceId: currentWorkspace?._id
      };

      if (currentResponse) {
        payload.lastResponse = {
          status: currentResponse.status,
          timeTaken: currentResponse.timeTaken,
          data: currentResponse.data,
          headers: currentResponse.headers
        };
      }

      if (currentAi) {
        payload.aiAnalysis = currentAi;
      }

      await toast.promise(
        (async () => {
          if (tab?.id?.startsWith('req_')) {
            const reqId = tab.id.replace('req_', '');
            const res = await api.patch(`/requests/${reqId}`, payload);

            // Sync tab state so name and configurations stick visually
            setTabs(prev => prev.map(t => t.id === tab.id ? {
              ...t,
              title: payload.name,
              method: payload.method,
              url: payload.url,
              collectionId: selectedCollection,
              headers: payload.headers,
              queryParams: payload.queryParams,
              body: { mode: bodyMode, content: bodyContent },
              updatedBy: res.data.data.request.updatedBy
            } : t));

          } else {
            const res = await api.post('/requests', payload);
            const newReqId = res.data.data.request._id;

            // Upgrade temporary tab to a persistent saved request tab
            setTabs(prev => prev.map(t => t.id === tab.id ? {
              ...t,
              id: `req_${newReqId}`,
              title: payload.name,
              method: payload.method,
              url: payload.url,
              collectionId: selectedCollection,
              headers: payload.headers,
              queryParams: payload.queryParams,
              body: { mode: bodyMode, content: bodyContent },
              updatedBy: res.data.data.request.updatedBy
            } : t));
            setActiveTabId(`req_${newReqId}`);
          }
          await fetchCollections(); // Refresh the sidebar
        })(),
        {
          loading: 'Saving request...',
          success: tab?.id?.startsWith('req_') ? 'Request updated successfully!' : 'Request saved successfully!',
          error: tab?.id?.startsWith('req_') ? 'Failed to update request' : 'Failed to save request'
        }
      );

      setShowSaveModal(false);
    } catch (err) {
      // Handled by toast.promise
    }
  };

  const handleKeyValueChange = (index, field, value, state, setState) => {
    const newState = [...state];
    newState[index][field] = value;

    // Auto-add new empty row if editing the last one
    if (index === state.length - 1 && value !== '') {
      newState.push({ key: '', value: '', isActive: true });
    }
    setState(newState);
    handleTyping();
  };

  const KeyValueEditor = ({ name, state, setState }) => (
    <div className="flex flex-col gap-2 w-full max-w-4xl">
      <div className="grid grid-cols-[30px_1fr_1fr_30px] gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2">
        <div></div>
        <div>Key</div>
        <div>Value</div>
        <div></div>
      </div>
      {state.map((item, i) => (
        <div key={i} className="grid grid-cols-[30px_1fr_1fr_30px] gap-2 items-center group">
          <div className="flex items-center justify-center">
            {/* Custom Glassmorphic Checkbox */}
            <label className="relative flex items-center justify-center cursor-pointer">
              <input
                type="checkbox"
                checked={item.isActive}
                onChange={(e) => handleKeyValueChange(i, 'isActive', e.target.checked, state, setState)}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded transition-all duration-200 border flex items-center justify-center shadow-sm ${item.isActive ? 'bg-emerald-500 border-emerald-500 shadow-emerald-500/30' : 'bg-slate-900 border-slate-600 group-hover:border-emerald-500/50'}`}>
                 {item.isActive && (
                    <svg className="w-3 h-3 text-slate-950 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                 )}
              </div>
            </label>
          </div>
          <input
            type="text"
            value={item.key}
            onChange={(e) => handleKeyValueChange(i, 'key', e.target.value, state, setState)}
            placeholder={name + " Key"}
            className="bg-transparent border border-slate-700/50 rounded px-3 py-1.5 text-sm font-mono focus:border-emerald-500/50 focus:outline-none transition-colors w-full placeholder:text-slate-600"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => handleKeyValueChange(i, 'value', e.target.value, state, setState)}
            placeholder="Value"
            className="bg-transparent border border-slate-700/50 rounded px-3 py-1.5 text-sm font-mono focus:border-emerald-500/50 focus:outline-none transition-colors w-full placeholder:text-slate-600"
          />
          <div className="flex items-center justify-center">
            {i !== state.length - 1 && (
              <button
                onClick={() => setState(state.filter((_, idx) => idx !== i))}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all font-bold"
              >×</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-800 relative">
      <div className="p-4 border-b border-slate-700 shrink-0 bg-slate-800/80 backdrop-blur z-10 sticky top-0">

        {/* Typing Overlay & Updated By text */}
        <div className="flex justify-between items-end mb-2 h-4">
          <div className="text-[10px] text-slate-500 font-medium">
            {tab?.updatedBy && `Last updated by ${tab.updatedBy.name}`}
          </div>
          {typingUsers[tab?.id] && typingUsers[tab?.id].userName !== user?.name && (
            <div className="text-xs font-medium text-emerald-400 animate-pulse flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              {typingUsers[tab.id].userName} is editing...
            </div>
          )}
        </div>

        <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700 ring-1 ring-inset ring-black/20">
          <div className="relative group shrink-0">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`appearance-none bg-transparent font-bold cursor-pointer focus:outline-none px-4 py-2 pr-8 rounded transition-colors uppercase text-sm
                ${method === 'GET' ? 'text-emerald-500 group-hover:bg-emerald-500/10' :
                  method === 'POST' ? 'text-blue-500 group-hover:bg-blue-500/10' :
                    method === 'DELETE' ? 'text-red-500 group-hover:bg-red-500/10' :
                      'text-orange-500 group-hover:bg-orange-500/10'}`}
            >
              {METHODS.map(m => <option key={m} value={m} className="bg-slate-800 text-white">{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <div className="w-[1px] bg-slate-700 my-1 shrink-0" />

          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); handleTyping(); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter request URL"
            className="flex-1 bg-transparent px-3 py-2 outline-none text-slate-200 placeholder:text-slate-500 font-mono text-sm w-full min-w-[100px]"
          />

          <button
            onClick={handleSend}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 border-0! m-0! rounded-md font-medium text-sm flex items-center gap-2 transition-all shrink-0 ring-1 ring-inset ring-white/10 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            <Send size={14} className="" /> <span className="hidden sm:inline">Send</span>
          </button>
          <button onClick={() => setShowSaveModal(true)} className="bg-slate-700 hover:bg-slate-600 border-0! m-0! text-slate-200 px-3 py-2 rounded-md transition-colors shrink-0 ring-1 ring-inset ring-white/10">
            <Save size={14} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-700 shrink-0 px-2 mt-1">
        {['Params', 'Headers', 'Auth', 'Body'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 lg:py-2 text-xs lg:text-sm font-medium transition-all relative ${activeTab === t ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'}`}
          >
            {t}
            {activeTab === t && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 rounded-t-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'Params' && <KeyValueEditor name="Query" state={queryParams} setState={setQueryParams} />}
        {activeTab === 'Headers' && <KeyValueEditor name="Header" state={headers} setState={setHeaders} />}
        {activeTab === 'Auth' && <div className="text-sm text-slate-500 italic p-2 border border-dashed border-slate-700 rounded-lg max-w-lg">Auth tab coming soon...</div>}
        {activeTab === 'Body' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex gap-4 mb-2">
              {['none', 'json', 'form-data', 'x-www-form-urlencoded'].map(m => (
                <label key={m} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm ${bodyMode === m ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-slate-600 bg-slate-900 group-hover:border-emerald-500/50 group-hover:bg-slate-800'}`}>
                    {bodyMode === m && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />}
                  </div>
                  <input
                    type="radio"
                    name="bodyMode"
                    value={m}
                    checked={bodyMode === m}
                    onChange={() => setBodyMode(m)}
                    className="hidden"
                  />
                  <span className={`transition-colors ${bodyMode === m ? 'text-emerald-400 font-medium' : 'text-slate-400 group-hover:text-slate-200'}`}>{m}</span>
                </label>
              ))}
            </div>

            {bodyMode === 'json' ? (
              <textarea
                value={bodyContent}
                onChange={(e) => { setBodyContent(e.target.value); handleTyping(); }}
                className="flex-1 w-full bg-[#1e1e1e] border border-slate-700/50 rounded-lg p-4 font-mono text-sm text-[#d4d4d4] focus:outline-none focus:border-emerald-500/50 custom-scrollbar shadow-inner resize-none min-h-[300px]"
                spellCheck="false"
              />
            ) : (
              <div className="p-4 text-sm text-slate-500 border border-dashed border-slate-700 rounded-lg">
                Only JSON body is fully supported in this demo.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Request Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight">Save Request</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-white transition-colors p-1"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-medium">Request Name</label>
                <input
                  type="text"
                  value={requestName}
                  onChange={e => setRequestName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500 transition-colors"
                  placeholder="e.g. Get User Profile"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm text-slate-400 font-medium">Save to Collection</label>
                  <button onClick={handleCreateCollection} className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                    + New Collection
                  </button>
                </div>
                {collections.length === 0 ? (
                  <div className="p-3 text-sm text-orange-400 bg-orange-500/10 rounded-lg border border-orange-500/20 flex flex-col items-center gap-2 text-center">
                    <span>No collections found. Click the button to create one!</span>
                    <button onClick={handleCreateCollection} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors w-full">
                      Create Collection
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedCollection}
                    onChange={e => setSelectedCollection(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="" disabled className="text-slate-500">Select a collection...</option>
                    {collections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <button
                onClick={handleSaveRequest}
                disabled={collections.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg mt-4 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestPane;
