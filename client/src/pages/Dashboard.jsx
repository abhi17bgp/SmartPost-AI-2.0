import React, { useState } from 'react';
import TabManager from '../components/TabManager';
import Sidebar from '../components/Sidebar';
import RequestPane from '../components/RequestPane';
import ResponsePane from '../components/ResponsePane';
import { useWorkspace } from '../context/WorkspaceContext';

const Dashboard = () => {
  const { tabs, activeTabId, responseData, setResponseData, responseLoading, setResponseLoading } = useWorkspace();

  const activeTab = tabs.find(t => t.id === activeTabId);

  const handleSetResponseData = (data) => {
    setResponseData(prev => ({ ...prev, [activeTabId]: data }));
  };

  const handleSetResponseLoading = (loading) => {
    setResponseLoading(prev => ({ ...prev, [activeTabId]: loading }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 border-t-[3px] border-emerald-500 font-sans">
      <Sidebar />

      {/* Main Layout */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 shadow-xl overflow-hidden shadow-black/40 z-20 ring-1 ring-slate-700 relative">
        <TabManager />

        {/* Workspace Panes Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Request Pane */}
          <section className="flex-1 flex flex-col border-r border-slate-700 lg:w-1/2 overflow-hidden bg-slate-800 shrink-0">
            <RequestPane
              key={`req_${activeTabId}`}
              tab={activeTab}
              setResponseData={handleSetResponseData}
              setResponseLoading={handleSetResponseLoading}
            />
          </section>

          {/* Response Pane */}
          <section className="flex-1 flex flex-col lg:w-1/2 overflow-hidden bg-slate-900 shrink-0">
            <ResponsePane
              key={`res_${activeTabId}`}
              data={responseData[activeTabId]}
              loading={responseLoading[activeTabId]}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
