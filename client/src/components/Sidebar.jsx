import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Plus, PlaySquare, ChevronRight, ChevronDown, Trash2, X, Folder, History, Users, KeyRound, Check, Bot, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axiosInstance';
import { useDialog } from '../context/DialogContext';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';

const Sidebar = () => {
  const { currentWorkspace, setCurrentWorkspace, workspaces, fetchWorkspaces, collections, savedRequests, fetchCollections, history, fetchHistory, tabs, setTabs, setActiveTabId, setResponseData, setResponseAi, setLatestHistoryId } = useWorkspace();
  const { user, logout, updateProfile } = useAuth();
  const { confirm, prompt } = useDialog();
  const [activeTab, setActiveTab] = useState('collections'); // 'collections' or 'history'
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const isDeletingRef = React.useRef(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    company: user?.company || '',
    title: user?.title || ''
  });

  useEffect(() => {
    if (user && showSettingsModal) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        company: user.company || '',
        title: user.title || ''
      });
    }
  }, [user, showSettingsModal]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await toast.promise(
        updateProfile(profileForm),
        {
          loading: 'Updating profile...',
          success: 'Profile updated successfully!',
          error: (err) => err.response?.data?.message || err.message || 'Failed to update profile'
        }
      );
    } catch (err) { }
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = await confirm("Delete Account", "Are you absolutely sure you want to delete your account? This action cannot be undone.", { isDanger: true, confirmText: 'Delete My Account' });
    if (isConfirmed) {
      try {
        await toast.promise(
          api.delete('/auth/deleteMe'),
          {
            loading: 'Deleting account...',
            success: 'Account deleted successfully!',
            error: 'Failed to delete account'
          }
        );
        logout();
      } catch (err) {
        // Handled by toast
      }
    }
  };

  const handleCreateWorkspace = async () => {
    const name = await prompt("New Workspace", "Enter a name for your new workspace:", { placeholder: "e.g. My Team Project" });
    if (!name) return;
    try {
      const res = await toast.promise(
        api.post('/workspaces', { name }),
        {
          loading: 'Creating workspace...',
          success: 'Workspace created!',
          error: 'Failed to create workspace'
        }
      );
      fetchWorkspaces();
      setCurrentWorkspace(res.data.data.workspace);
      setShowWorkspaceMenu(false);
    } catch (err) { }
  };

  const handleJoinWorkspace = async () => {
    const joinCode = await prompt("Join Workspace", "Enter the 6-character workspace mix code:", { placeholder: "e.g. A1B2C3" });
    if (!joinCode) return;
    try {
      const res = await toast.promise(
        api.post('/workspaces/join', { joinCode: joinCode.toUpperCase() }),
        {
          loading: 'Joining workspace...',
          success: 'Successfully joined!',
          error: (err) => err.response?.data?.message || 'Failed to join workspace'
        }
      );
      fetchWorkspaces();
      setCurrentWorkspace(res.data.data.workspace);
      setShowWorkspaceMenu(false);
    } catch (err) { }
  };

  const handleCreateCollection = async () => {
    if (!currentWorkspace) {
      toast.error("You must have an active workspace to create a collection.");
      return;
    }
    const name = await prompt("New Collection", "Enter a name for your collection:", { placeholder: "e.g. Users API" });
    if (!name) return;
    try {
      await toast.promise(
        api.post('/collections', { name, workspaceId: currentWorkspace._id }).then(() => fetchCollections()),
        {
          loading: 'Creating collection...',
          success: 'Collection created!',
          error: 'Failed to create collection'
        }
      );
    } catch (err) {
      // Error handled by toast.promise
    }
  };

  const handleHistoryClick = (item) => {
    const historyTabId = `history_${item._id}`;
    const existingTab = tabs.find(t => t.id === historyTabId);

    if (!existingTab) {
      const newTab = {
        id: historyTabId,
        title: item.url,
        method: item.method,
        url: item.url,
        headers: item.headers?.length ? item.headers : [{ key: '', value: '', isActive: true }],
        queryParams: item.queryParams?.length ? item.queryParams : [{ key: '', value: '', isActive: true }],
        body: {
          mode: item.bodyMode || 'json',
          content: item.bodyContent || '{\n  \n}'
        }
      };
      setTabs([...tabs, newTab]);
    }

    setActiveTabId(historyTabId);

    if (item.responseData) {
      setResponseData(prev => ({
        ...prev,
        [historyTabId]: {
          status: item.status,
          statusText: item.status >= 200 && item.status < 300 ? 'OK' : 'Error',
          timeTaken: item.timeTaken,
          data: item.responseData,
          headers: item.responseHeaders || {}
        }
      }));
    }

    if (item.aiAnalysis) {
      setResponseAi(prev => ({
        ...prev,
        [historyTabId]: item.aiAnalysis
      }));
    }

    setLatestHistoryId(prev => ({
      ...prev,
      [historyTabId]: item._id
    }));
  };

  const handleSavedRequestClick = (req) => {
    const reqTabId = `req_${req._id}`;
    const existingTab = tabs.find(t => t.id === reqTabId);

    if (!existingTab) {
      const newTab = {
        id: reqTabId,
        title: req.name || req.url,
        method: req.method,
        url: req.url,
        collectionId: req.collectionId,
        updatedBy: req.updatedBy,
        headers: req.headers?.length ? req.headers : [{ key: '', value: '', isActive: true }],
        queryParams: req.queryParams?.length ? req.queryParams : [{ key: '', value: '', isActive: true }],
        body: {
          mode: req.body?.type || 'json',
          content: req.body?.content || '{\n  \n}'
        }
      };
      setTabs([...tabs, newTab]);
      if (req.lastResponse) {
        setResponseData(prev => ({
          ...prev,
          [reqTabId]: {
            status: req.lastResponse.status,
            timeTaken: req.lastResponse.timeTaken,
            data: req.lastResponse.data,
            headers: req.lastResponse.headers
          }
        }));
      }

      if (req.aiAnalysis) {
        setResponseAi(prev => ({
          ...prev,
          [reqTabId]: req.aiAnalysis
        }));
      }

    } else {
      setActiveTabId(reqTabId);
    }
  };

  const handleDeleteCollection = async (e, collectionId) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeletingRef.current) return;
    const isConfirmed = await confirm("Delete Collection", "Are you sure you want to delete this collection and all its requests?", { isDanger: true, confirmText: 'Delete' });
    if (!isConfirmed) return;

    isDeletingRef.current = true;

    try {
      await toast.promise(
        api.delete(`/collections/${collectionId}`).then(async (res) => {
          if (res.status === 200 || res.status === 204) {
            await fetchCollections();
          } else {
            throw new Error("Delete failed");
          }
        }),
        {
          loading: 'Deleting collection...',
          success: 'Collection deleted!',
          error: (err) => err.response?.data?.message || err.message || 'Failed to delete collection',
        }
      );
    } catch (err) {
      console.error("Delete Collection Error:", err);
    } finally {
      isDeletingRef.current = false;
    }
  };

  const handleDeleteRequest = async (e, reqId) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeletingRef.current) return;
    const isConfirmed = await confirm("Delete Request", "Are you sure you want to delete this request?", { isDanger: true, confirmText: 'Delete' });
    if (!isConfirmed) return;

    isDeletingRef.current = true;

    try {
      await toast.promise(
        api.delete(`/requests/${reqId}`).then(async (res) => {
          if (res.status === 200 || res.status === 204) {
            await fetchCollections();
          } else {
            throw new Error("Delete failed");
          }
        }),
        {
          loading: 'Deleting request...',
          success: 'Request deleted!',
          error: (err) => err.response?.data?.message || err.message || 'Failed to delete request',
        }
      );

      const reqTabId = `req_${reqId}`;
      let newTabs = tabs.filter(t => t.id !== reqTabId);

      if (newTabs.length === 0) {
        newTabs = [{ id: 'new', title: 'Untitled Request', isNew: true }];
      }

      setTabs(newTabs);
      setActiveTabId(newTabs[newTabs.length - 1].id);
    } catch (err) {
      console.error("Delete Request Error:", err);
    } finally {
      isDeletingRef.current = false;
    }
  };

  const handleDeleteHistory = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeletingRef.current) return;
    const isConfirmed = await confirm("Delete History", "Are you sure you want to delete this history item?", { isDanger: true, confirmText: 'Delete' });
    if (!isConfirmed) return;

    isDeletingRef.current = true;
    try {
      await toast.promise(
        api.delete(`/history/${id}`).then(async (res) => {
          if (res.status === 200 || res.status === 204) {
            await fetchHistory();
          } else {
            throw new Error("Delete failed");
          }
        }),
        {
          loading: 'Deleting history...',
          success: 'History deleted!',
          error: 'Failed to delete history'
        }
      );
    } catch (err) {
      console.error("Delete History Error:", err);
    } finally {
      isDeletingRef.current = false;
    }
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col h-full font-sans transition-all duration-300">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80 backdrop-blur top-0 sticky z-10">
        <span className="font-bold text-xl flex items-center gap-2 tracking-tight">
          <PlaySquare size={20} className="text-emerald-500" />
          <span className="text-white">Smart</span><span className="text-emerald-500 -ml-1">Post</span>
        </span>
      </div>

      <div className="p-3 border-b border-slate-700 relative">
        <div
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="bg-slate-900 rounded-lg p-2 px-3 border border-slate-700/50 flex items-center justify-between cursor-pointer hover:border-slate-600 transition-colors"
        >
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Workspace</span>
            <span className="text-sm font-medium text-slate-200 truncate">{currentWorkspace?.name || 'Loading...'}</span>
          </div>
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
        </div>

        {/* Workspace Dropdown */}
        {showWorkspaceMenu && (
          <div className="absolute top-full left-3 right-3 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden transform origin-top animate-dropdown border-b border-slate-900">
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {workspaces.map((w) => (
                <button
                  key={w._id}
                  onClick={() => {
                    setCurrentWorkspace(w);
                    setShowWorkspaceMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-700/50 transition-colors ${currentWorkspace?._id === w._id ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-slate-300'}`}
                >
                  <div className="w-4 flex-shrink-0 flex justify-center">
                    {currentWorkspace?._id === w._id && <Check size={14} />}
                  </div>
                  <span className="truncate">{w.name}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-700 bg-slate-800/80 p-1 flex flex-col">
              <button onClick={() => { setShowWorkspaceSettings(true); setShowWorkspaceMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-slate-300 flex items-center gap-2 hover:bg-slate-700/50 transition-colors rounded">
                <Settings size={14} className="text-slate-400" /> Manage Current Workspace
              </button>
              <button onClick={handleCreateWorkspace} className="w-full text-left px-3 py-2 text-xs text-slate-300 flex items-center gap-2 hover:bg-slate-700/50 transition-colors rounded">
                <Plus size={14} className="text-slate-400" /> Create New Workspace
              </button>
              <button onClick={handleJoinWorkspace} className="w-full text-left px-3 py-2 text-xs text-slate-300 flex items-center gap-2 hover:bg-slate-700/50 transition-colors rounded">
                <KeyRound size={14} className="text-slate-400" /> Join Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex border-b border-slate-700 text-sm">
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'collections' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Folder size={16} /> Collections
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 font-medium transition-colors ${activeTab === 'history' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <History size={16} /> History
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-h-[calc(100vh-220px)] custom-scrollbar">
        {activeTab === 'collections' ? (
          <div className="p-2 space-y-1">
            <div className="p-2 flex items-center justify-between text-xs text-slate-400 uppercase font-semibold tracking-wider">
              <span>Saved Requests</span>
              <button onClick={handleCreateCollection} className="hover:text-emerald-400 hover:bg-emerald-500/10 p-1 rounded transition-colors" title="New Collection"><Plus size={14} /></button>
            </div>
            {collections.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 mt-4 border border-dashed border-slate-700 rounded-lg mx-2">
                No collections yet.<br /><span onClick={handleCreateCollection} className="text-emerald-500/80 cursor-pointer hover:text-emerald-400">Create one</span> to save requests.
              </div>
            ) : (
              collections.map(c => (
                <div key={c._id} className="mb-2">
                  <div className="p-2 rounded hover:bg-slate-700/50 cursor-pointer flex items-center text-sm text-slate-300 transition-colors group/col">
                    <ChevronRight size={14} className="text-slate-500 mr-2" />
                    <Folder size={14} className="text-emerald-500/70 mr-2" />
                    <span className="truncate flex-1 font-medium">{c.name}</span>
                    <button onClick={(e) => handleDeleteCollection(e, c._id)} className="opacity-0 group-hover/col:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="pl-6 border-l border-slate-700/50 flex flex-col gap-1 ml-3 mt-1">
                    {savedRequests.filter(r => r.collectionId === c._id).map(req => (
                      <div key={req._id} onClick={() => handleSavedRequestClick(req)} className="p-1.5 rounded hover:bg-slate-700/50 cursor-pointer flex items-center gap-2 text-xs transition-colors group/req">
                        <span className={`font-mono font-bold text-[10px] ${req.method === 'GET' ? 'text-emerald-500' : req.method === 'POST' ? 'text-blue-500' : req.method === 'DELETE' ? 'text-red-500' : 'text-orange-500'}`}>
                          {req.method}
                        </span>
                        <span className="truncate flex-1 text-slate-400 group-hover/req:text-slate-200 transition-colors">{req.name}</span>
                        <button onClick={(e) => handleDeleteRequest(e, req._id)} className="opacity-0 group-hover/req:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            <div className="p-2 flex items-center text-xs text-slate-400 uppercase font-semibold tracking-wider">
              <span>Recent Activity</span>
            </div>
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 mt-4 border border-dashed border-slate-700 rounded-lg mx-2">
                No recent requests.
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} onClick={() => handleHistoryClick(h)} className="p-2 rounded hover:bg-slate-700/50 cursor-pointer text-xs transition-colors group relative">
                  <div className="flex items-center gap-2 mb-1 pr-6">
                    <span className={`font-mono font-bold ${h.method === 'GET' ? 'text-emerald-500' : h.method === 'POST' ? 'text-blue-500' : h.method === 'DELETE' ? 'text-red-500' : 'text-orange-500'}`}>
                      {h.method}
                    </span>
                    <span className="truncate flex-1 text-slate-300 group-hover:text-white transition-colors">{h.url}</span>
                    <div className="flex items-center gap-1">
                      {h.aiAnalysis && <Bot size={12} className="text-emerald-400" title="AI Analysis Attached" />}
                      {h.performanceMetrics && <Activity size={12} className="text-indigo-400" title="Performance Metrics Attached" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pr-6">
                    <span className={h.status >= 200 && h.status < 300 ? 'text-emerald-500/70' : 'text-red-500/70'}>{h.status} {h.status >= 200 && h.status < 300 ? 'OK' : 'ERR'}</span>
                    <span>{h.timeTaken}ms</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteHistory(e, h._id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded transition-all"
                    title="Delete history item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800 shrink-0">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-slate-900 border border-slate-700 shadow-inner">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-white/20">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-slate-200 truncate">{user?.name}</span>
            <span className="text-[10px] text-slate-400 truncate font-mono">{user?.email}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettingsModal(true)} className="flex-1 flex items-center justify-center gap-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg transition-colors ring-1 ring-inset ring-slate-600/50">
            <Settings size={14} /> Settings
          </button>
          <button onClick={logout} className="flex-1 flex items-center justify-center gap-2 text-xs font-medium bg-slate-900 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-400 border border-slate-700 py-2 rounded-lg transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight">Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <form onSubmit={handleUpdateProfile} className="bg-slate-900 border border-slate-700/50 rounded-lg p-4 shadow-inner">
                <h4 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">Profile Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 tracking-wider">Name *</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 tracking-wider">Email Address (Read-only)</label>
                    <input
                      disabled
                      type="email"
                      className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-400 text-sm font-mono rounded px-2 py-1.5 focus:outline-none cursor-not-allowed select-none"
                      value={profileForm.email}
                      title="Your email address cannot be changed"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-800/50">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 tracking-wider">Bio (Optional)</label>
                    <textarea
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500 resize-none h-16"
                      value={profileForm.bio}
                      placeholder="A short bio about yourself..."
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 tracking-wider">Company (Optional)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                        value={profileForm.company}
                        placeholder="e.g. Acme Corp"
                        onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 tracking-wider">Title (Optional)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                        value={profileForm.title}
                        placeholder="e.g. Developer"
                        onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-1.5 px-4 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    Save Changes
                  </button>
                </div>
              </form>

              <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-xs font-bold text-red-500 mb-2 uppercase tracking-wider">Danger Zone</h4>
                <p className="text-xs text-red-400/80 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button
                  onClick={handleDeleteAccount}
                  className="w-full bg-red-500/10 hover:bg-red-500/50 text-red-500 font-bold tracking-tight py-2 rounded-lg transition-colors text-sm shadow-md ring-1 ring-inset ring-red-500/20"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Settings Modal */}
      {showWorkspaceSettings && (
        <WorkspaceSettingsModal onClose={() => setShowWorkspaceSettings(false)} />
      )}
    </aside>
  );
};

export default Sidebar;
