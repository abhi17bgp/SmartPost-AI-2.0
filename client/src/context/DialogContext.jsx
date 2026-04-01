import React, { createContext, useContext, useState, useEffect } from 'react';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

const GlassDialog = ({ dialog, onClose }) => {
  const [inputValue, setInputValue] = useState(dialog.defaultValue || '');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose(dialog.id, dialog.type === 'prompt' ? null : false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (dialog.type === 'prompt') {
      onClose(dialog.id, inputValue.trim() || null);
    } else {
      onClose(dialog.id, true);
    }
  };

  return (
    <div className="pointer-events-auto relative w-full max-w-sm sm:max-w-md bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in origin-center transform ring-1 ring-white/10 z-50">
      {/* Decorative Top Gradient Edge */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${dialog.isDanger ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`} />
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
          {dialog.title}
        </h3>
        
        {dialog.message && (
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            {dialog.message}
          </p>
        )}
        
        <form onSubmit={handleSubmit}>
          {dialog.type === 'prompt' && (
            <input 
              autoFocus
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={dialog.placeholder}
              className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all mb-6 shadow-inner"
            />
          )}

          <div className="flex justify-end gap-3 font-medium">
            {dialog.type !== 'alert' && (
              <button 
                type="button" 
                onClick={() => onClose(dialog.id, dialog.type === 'prompt' ? null : false)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              >
                {dialog.cancelText || 'Cancel'}
              </button>
            )}
            <button 
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white shadow-lg transition-all transform active:scale-95 border border-transparent ${
                dialog.isDanger 
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20 border-rose-500/50' 
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20 border-emerald-500/50'
              }`}
            >
              {dialog.confirmText || 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DialogProvider = ({ children }) => {
  const [dialogs, setDialogs] = useState([]);

  const confirm = (title, message, options = {}) => {
    return new Promise((resolve) => {
      setDialogs(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'confirm',
        title,
        message,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        isDanger: options.isDanger || false,
        resolve
      }]);
    });
  };

  const prompt = (title, message, options = {}) => {
    return new Promise((resolve) => {
      setDialogs(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'prompt',
        title,
        message,
        placeholder: options.placeholder || "",
        defaultValue: options.defaultValue || "",
        confirmText: options.confirmText || "Submit",
        cancelText: options.cancelText || "Cancel",
        resolve
      }]);
    });
  };

  const notifyAlert = (title, message, options = {}) => {
    return new Promise((resolve) => {
      setDialogs(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'alert',
        title,
        message,
        confirmText: options.confirmText || "OK",
        isDanger: options.isDanger || false,
        resolve
      }]);
    });
  };

  const closeDialog = (id, result) => {
    const dialog = dialogs.find(d => d.id === id);
    if (dialog) dialog.resolve(result);
    setDialogs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert: notifyAlert }}>
      {children}
      
      {dialogs.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pointer-events-none font-sans">
          {/* Blur Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[4px] pointer-events-auto"
            onClick={() => closeDialog(dialogs[dialogs.length - 1].id, dialogs[dialogs.length - 1].type === 'prompt' ? null : false)}
          />
          {dialogs.map(dialog => (
            <GlassDialog key={dialog.id} dialog={dialog} onClose={closeDialog} />
          ))}
        </div>
      )}
    </DialogContext.Provider>
  );
};
