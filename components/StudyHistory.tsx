
import React, { useState, useEffect } from 'react';
import { History, Book, ChevronRight, Trash2, Calendar, Search, ArrowLeft, Loader2 } from 'lucide-react';
import { StudyHistoryEntry, Language } from '../types';
import * as cloud from '../services/cloudStore';

interface StudyHistoryProps {
  userEmail: string;
  onSelect: (entry: StudyHistoryEntry) => void;
  onBack: () => void;
  isDark: boolean;
  lang: Language;
}

const translations = {
  pt: {
    title: "Seu Histórico",
    subtitle: "Revisite seus estudos e análises anteriores.",
    empty: "Nenhum estudo salvo ainda.",
    searchPlaceholder: "Buscar por tópico...",
    deleteConfirm: "Remover este item?",
    back: "Voltar para Início",
    loading: "Buscando histórico na nuvem..."
  },
  en: {
    title: "Your History",
    subtitle: "Revisit your previous studies and analyses.",
    empty: "No saved studies yet.",
    searchPlaceholder: "Search by topic...",
    deleteConfirm: "Remove this item?",
    back: "Back to Home",
    loading: "Fetching history from cloud..."
  }
};

const StudyHistory: React.FC<StudyHistoryProps> = ({ userEmail, onSelect, onBack, isDark, lang }) => {
  const [history, setHistory] = useState<StudyHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const t = translations[lang];

  useEffect(() => {
    loadHistory();
  }, [userEmail]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await cloud.getGlobalHistory(userEmail);
    setHistory(data);
    setLoading(false);
  };

  const deleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t.deleteConfirm)) {
      const updated = history.filter(item => item.id !== id);
      setHistory(updated);
      await cloud.saveGlobalHistory(userEmail, updated);
    }
  };

  const filteredHistory = history.filter(item => 
    item.topic.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full">
          <button 
            onClick={onBack}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{t.title}</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
          </div>
        </div>

        <div className={`relative w-full sm:w-64 transition-all focus-within:w-full sm:focus-within:w-80`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-4" />
          <p className="font-bold text-slate-500">{t.loading}</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className={`py-20 text-center rounded-3xl border-2 border-dashed ${isDark ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
          <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">{t.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredHistory.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelect(item)}
              className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:border-indigo-500/50 hover:shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {item.files.length > 0 && item.files[0].mimeType.startsWith('image/') ? (
                  <img src={item.files[0].base64} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Book className="w-6 h-6 text-indigo-500/50" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{formatDate(item.date)}</span>
                </div>
                <h3 className="font-bold truncate text-lg">{item.topic}</h3>
                <p className={`text-sm truncate ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => deleteItem(item.id, e)}
                  className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDark ? 'hover:bg-red-500/10 text-slate-600 hover:text-red-500' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyHistory;
