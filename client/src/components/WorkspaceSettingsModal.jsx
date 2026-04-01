import React, { useState } from 'react';
import { X, Copy, Users, LogOut, KeyRound, ShieldAlert, Check } from 'lucide-react';
import api from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useDialog } from '../context/DialogContext';

const WorkspaceSettingsModal = ({ onClose }) => {
  const { currentWorkspace, fetchWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const { confirm } = useDialog();
  const [copied, setCopied] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  // If no workspace selected, just return null
  if (!currentWorkspace) return null;

  const ownerId = typeof currentWorkspace.owner === 'object' ? currentWorkspace.owner?._id : currentWorkspace.owner;
  const isAdmin = ownerId === user?._id;

  const handleCopyCode = async () => {
    if (!currentWorkspace.joinCode) return;
    try {
      await navigator.clipboard.writeText(currentWorkspace.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Join code copied!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleGenerateCode = async () => {
    setLoadingCode(true);
    try {
      await toast.promise(
        api.post(`/workspaces/${currentWorkspace._id}/generate-code`),
        {
          loading: 'Generating new code...',
          success: 'New join code generated!',
          error: 'Failed to generate code'
        }
      );
      // Workspace context socket will pick up 'workspace_updated' and fetch Workspaces again, so UI updates automatically.
    } catch (err) { } finally {
      setLoadingCode(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await toast.promise(
        api.delete(`/workspaces/${currentWorkspace._id}/members/${memberId}`),
        {
          loading: 'Removing member...',
          success: 'Member removed!',
          error: 'Failed to remove member'
        }
      );
    } catch (err) { }
  };

  const handleLeaveWorkspace = async () => {
    try {
      await toast.promise(
        api.post(`/workspaces/${currentWorkspace._id}/leave`),
        {
          loading: 'Leaving workspace...',
          success: 'Left workspace successfully!',
          error: 'Failed to leave workspace'
        }
      );
      onClose();
      fetchWorkspaces();
    } catch (err) { }
  };

  const handleDeleteWorkspace = async () => {
    const isConfirmed = await confirm("Delete Workspace", `Are you absolutely sure you want to delete "${currentWorkspace.name}"? This will delete all collections, requests, and history inside it.`, { isDanger: true, confirmText: 'Delete' });
    if (!isConfirmed) return;

    try {
      await toast.promise(
        api.delete(`/workspaces/${currentWorkspace._id}`),
        {
          loading: 'Deleting workspace...',
          success: 'Workspace deleted forever!',
          error: 'Failed to delete workspace'
        }
      );
      onClose();
      fetchWorkspaces();
    } catch (err) { }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white tracking-tight">
            <Users size={20} className="text-emerald-400" /> Workspace Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 flex-1">
          {/* Workspace Info */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Current Workspace</div>
            <div className="text-slate-200 text-lg font-bold">{currentWorkspace.name}</div>
          </div>

          {/* Join Code Section */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
              <KeyRound size={16} className="text-indigo-400" /> Collaboration
            </h4>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-600 rounded px-4 py-2 flex-1 font-mono text-center tracking-widest text-lg text-emerald-400 font-bold select-all">
                {currentWorkspace.joinCode || '------'}
              </div>
              {currentWorkspace.joinCode && (
                <button
                  onClick={handleCopyCode}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded transition-colors border border-slate-600"
                  title="Copy Code"
                >
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={handleGenerateCode}
                disabled={loadingCode}
                className="mt-3 w-full text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 py-2 rounded font-medium border border-indigo-500/30 transition-colors"
              >
                {currentWorkspace.joinCode ? 'Regenerate Code' : 'Generate Join Code'}
              </button>
            )}
            <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
              Share this code with your team to allow them to join and collaborate in real-time.
            </p>
          </div>

          {/* Members List */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 ml-1">Members ({currentWorkspace.members?.length || 0})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {currentWorkspace.members?.map((member) => {
                const isMe = member.user?._id === user?._id;
                const isMemberAdmin = member.role === 'admin';
                return (
                  <div key={member._id || member.user._id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex flex-shrink-0 items-center justify-center font-bold text-xs text-slate-300 ring-1 ring-slate-600">
                        {member.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-medium text-slate-200 truncate flex items-center gap-2">
                          {member.user?.name} {isMe && <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded ml-1 border border-slate-700">You</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">{member.user?.email}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isMemberAdmin ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-700 text-slate-400'}`}>
                        {member.role}
                      </span>
                      {isAdmin && !isMe && !isMemberAdmin && (
                        <button onClick={() => handleRemoveMember(member.user._id)} className="text-[10px] text-red-400 hover:underline mt-1">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Leave / Delete Workspace Action */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          {!isAdmin ? (
            <button
              onClick={handleLeaveWorkspace}
              className="flex w-full items-center justify-center gap-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 py-2 rounded border border-red-500/30 transition-colors font-medium"
            >
              <LogOut size={16} /> Leave Workspace
            </button>
          ) : (
            <button
              onClick={handleDeleteWorkspace}
              className="flex w-full items-center justify-center gap-2 text-sm text-red-500 bg-red-500/5 hover:bg-red-500/10 py-2 rounded border border-red-500/20 transition-colors font-bold tracking-tight shadow-sm"
            >
              <ShieldAlert size={16} /> Delete Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettingsModal;
