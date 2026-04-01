import React from 'react';
import { Plus, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const TabManager = () => {
  const { tabs, setTabs, activeTabId, setActiveTabId } = useWorkspace();

  const handleAddTab = () => {
    const newId = `tab_${Date.now()}`;
    setTabs([...tabs, { id: newId, title: 'Untitled Request', isNew: true }]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (e, id) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // Create a fresh tab if closing the last one
      const newId = `tab_${Date.now()}`;
      setTabs([{ id: newId, title: 'Untitled Request', isNew: true }]);
      setActiveTabId(newId);
      return;
    }

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);

    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <div className="flex bg-slate-900 border-b border-slate-700 overflow-x-auto h-10 w-full shrink-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style dangerouslySetInnerHTML={{ __html: `::-webkit-scrollbar { display: none; }` }} />
      <div className="flex items-center">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`
              h-full flex items-center px-4 min-w-[150px] max-w-[200px] border-r border-slate-700 cursor-pointer group select-none transition-colors
              ${activeTabId === tab.id
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-t-emerald-500'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 border-t-2 border-t-transparent'}
            `}
          >
            <div className="flex items-center gap-2 overflow-hidden w-full h-10">
              <span className={`text-[10px] font-mono font-bold shrink-0 ${tab.method === 'GET' ? 'text-emerald-500' : tab.method === 'POST' ? 'text-blue-500' : 'text-slate-500'}`}>
                {tab.method || 'GET'}
              </span>
              <span className="text-xs truncate flex-1 font-medium">{tab.title}</span>
              <button
                onClick={(e) => handleCloseTab(e, tab.id)}
                className={`shrink-0 p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ${activeTabId === tab.id ? 'opacity-100 text-slate-400' : ''}`}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={handleAddTab}
          className="h-10 px-3 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 transition-colors flex items-center justify-center shrink-0 border-r border-slate-700"
          title="New Tab"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default TabManager;
