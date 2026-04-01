import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosInstance';
import { useAuth } from './AuthContext';
import { useDialog } from './DialogContext';
import { io } from 'socket.io-client';

const WorkspaceContext = createContext();

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  const { alert: dialogAlert } = useDialog();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [collections, setCollections] = useState([]);
  const [savedRequests, setSavedRequests] = useState([]);
  const [history, setHistory] = useState([]);

  // Tabs representing open requests in the main pane
  const [tabs, setTabs] = useState([{ id: 'new', title: 'Untitled Request', isNew: true }]);
  const [activeTabId, setActiveTabId] = useState('new');

  // Shared Response State for tabs
  const [responseData, setResponseData] = useState({});
  const [responseLoading, setResponseLoading] = useState({});
  const [responseAi, setResponseAi] = useState({});

  // Real-time typing tracking (key: requestId, value: { userName, timeout })
  const [typingUsers, setTypingUsers] = useState({});
  const [responseAiLoading, setResponseAiLoading] = useState({});
  const [latestHistoryId, setLatestHistoryId] = useState({});

  // Socket reference
  const [socket, setSocket] = useState(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/workspaces');
      if (res.data.data.workspaces.length > 0) {
        const newWorkspaces = res.data.data.workspaces;
        setWorkspaces(newWorkspaces);
        setCurrentWorkspace(prev => {
          if (!prev) return newWorkspaces[0];
          const refreshed = newWorkspaces.find(w => w._id === prev._id);
          // Only update if we found it, to avoid unnecessary reference changes if nothing changed.
          // In practice, it's safer to just return refreshed, but to be safe we'll return refreshed or default.
          return refreshed || newWorkspaces[0];
        });
      } else {
        const createRes = await api.post('/workspaces', { name: 'My Workspace' });
        const newWorkspace = createRes.data.data.workspace;
        setWorkspaces([newWorkspace]);
        setCurrentWorkspace(newWorkspace);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    }
  }, [user]);

  const fetchCollections = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const res = await api.get(`/collections?workspaceId=${currentWorkspace._id}`);
      setCollections(res.data.data.collections || []);
      setSavedRequests(res.data.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch collections', err);
    }
  }, [currentWorkspace]);

  const fetchHistory = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    try {
      const res = await api.get(`/history?workspaceId=${currentWorkspace._id}`);
      setHistory(res.data.data.history || []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  }, [user, currentWorkspace]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      fetchCollections();
      fetchHistory();
    }
  }, [currentWorkspace, fetchCollections, fetchHistory]);

  // Socket setup
  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      return;
    }

    const newSocket = io('http://localhost:5000', {
      withCredentials: true
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !currentWorkspace) return;

    socket.emit('join_workspace', currentWorkspace._id);

    const onUpdate = () => {
      fetchCollections();
    };

    const onHistoryUpdate = () => {
      fetchHistory();
    };

    const onWorkspaceUpdate = () => {
      fetchWorkspaces();
    };

    const onMemberRemoved = async (data) => {
      if (data.userId === user._id && data.workspaceId === currentWorkspace._id) {
        await dialogAlert('Workspace Access Revoked', 'You have been removed from this workspace.', { isDanger: true });
        fetchWorkspaces(); // Will switch workspace if current is unavailable
      }
    };

    socket.on('collection_updated', onUpdate);
    socket.on('collection_deleted', onUpdate);
    socket.on('request_updated', onUpdate);
    socket.on('request_deleted', onUpdate);

    socket.on('history_added', onHistoryUpdate);
    socket.on('history_updated', onHistoryUpdate);
    socket.on('history_deleted', onHistoryUpdate);
    socket.on('history_cleared', onHistoryUpdate);

    socket.on('workspace_updated', onWorkspaceUpdate);
    socket.on('member_removed', onMemberRemoved);

    const onTyping = ({ userName, requestId }) => {
      setTypingUsers(prev => {
        const newDict = { ...prev };
        if (newDict[requestId]?.timeout) clearTimeout(newDict[requestId].timeout);
        newDict[requestId] = {
          userName,
          timeout: setTimeout(() => {
            setTypingUsers(current => {
              const updated = { ...current };
              delete updated[requestId];
              return updated;
            });
          }, 3000) // Clear after 3 seconds of inactivity
        };
        return newDict;
      });
    };

    const onStopTyping = ({ requestId }) => {
      setTypingUsers(prev => {
        const newDict = { ...prev };
        if (newDict[requestId]) {
          clearTimeout(newDict[requestId].timeout);
          delete newDict[requestId];
        }
        return newDict;
      });
    };

    socket.on('user_typing_request', onTyping);
    socket.on('user_stopped_typing', onStopTyping);

    return () => {
      socket.emit('leave_workspace', currentWorkspace._id);
      socket.off('collection_updated', onUpdate);
      socket.off('collection_deleted', onUpdate);
      socket.off('request_updated', onUpdate);
      socket.off('request_deleted', onUpdate);
      socket.off('history_added', onHistoryUpdate);
      socket.off('history_updated', onHistoryUpdate);
      socket.off('history_deleted', onHistoryUpdate);
      socket.off('history_cleared', onHistoryUpdate);
      socket.off('workspace_updated', onWorkspaceUpdate);
      socket.off('member_removed', onMemberRemoved);
      socket.off('user_typing_request', onTyping);
      socket.off('user_stopped_typing', onStopTyping);
    };

  }, [socket, currentWorkspace, fetchCollections, fetchHistory, fetchWorkspaces, user]);

  const value = {
    workspaces,
    fetchWorkspaces,
    currentWorkspace,
    setCurrentWorkspace,
    collections,
    savedRequests,
    fetchCollections,
    history,
    setHistory,
    fetchHistory,
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    responseData,
    setResponseData,
    responseLoading,
    setResponseLoading,
    responseAi,
    setResponseAi,
    responseAiLoading,
    setResponseAiLoading,
    latestHistoryId,
    setLatestHistoryId,
    typingUsers,
    socket
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
