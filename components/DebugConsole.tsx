
import React, { useState, useEffect } from 'react';
import { Terminal, X, Trash2, Copy, AlertCircle, Info, Bug } from 'lucide-react';
import { AppLog } from '../types';

interface DebugConsoleProps {
  logs: AppLog[];
  onClear: () => void;
  isDark: boolean;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ logs, onClear, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);

  const copyLogs = () => {
    const text = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.type.toUpperCase()}: ${l.message}\n${l.stack || ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
    alert("Logs copiados para a área de transferência!");
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-[200] p-4 rounded-full shadow-2xl transition-all active:scale-90 ${logs.some(l => l.type === 'error') ? 'bg-red-600 animate-pulse' : 'bg-slate-800'}`}
      >
        <Terminal className="w-6 h-6 text-white" />
        {logs.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
            {logs.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[210] flex flex-col bg-slate-950 text-slate-300 font-mono text-xs">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-indigo-400" />
          <h2 className="font-bold text-sm text-white uppercase tracking-widest">System Output Console</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLogs} className="p-2 hover:bg-slate-800 rounded-lg" title="Copiar"><Copy size={16} /></button>
          <button onClick={onClear} className="p-2 hover:bg-red-900/30 rounded-lg text-red-500" title="Limpar"><Trash2 size={16} /></button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X size={16} /></button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 && <div className="text-slate-600 text-center py-20">Nenhum log registrado.</div>}
        {logs.map(log => (
          <div key={log.id} className={`p-3 rounded-lg border ${log.type === 'error' ? 'bg-red-950/20 border-red-900/30' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className={`font-black uppercase text-[10px] px-1.5 py-0.5 rounded ${
                log.type === 'error' ? 'bg-red-600 text-white' : 
                log.type === 'ai' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {log.type}
              </span>
            </div>
            <div className={`font-bold text-sm ${log.type === 'error' ? 'text-red-400' : 'text-slate-200'}`}>
              {log.message}
            </div>
            {log.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-400">Ver Stack Trace</summary>
                <pre className="mt-2 p-2 bg-black/40 rounded text-[10px] overflow-x-auto text-red-300/70">
                  {log.stack}
                </pre>
              </details>
            )}
            {log.details && (
              <pre className="mt-2 p-2 bg-black/40 rounded text-[10px] overflow-x-auto text-indigo-300/70">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugConsole;
