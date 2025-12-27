
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Sparkles, 
  BookOpen, 
  Settings, 
  Clock, 
  ChevronRight, 
  Zap, 
  Heart, 
  Save,
  LayoutDashboard
} from 'lucide-react';
import { User, Language, StudyHistoryEntry } from '../types';

interface DashboardProps {
  user: User;
  history: StudyHistoryEntry[];
  onUpdatePreferences: (prefs: string) => void;
  onNavigateToHistory: () => void;
  onNavigateToNewStudy: () => void;
  isDark: boolean;
  lang: Language;
}

const ADMIN_EMAILS = ["samuelribeiropassos@icloud.com", "cassiuspereirahector@gmail.com"];

const translations = {
  pt: {
    welcome: "Bom dia,",
    stats: "Suas Estatísticas",
    totalStudies: "Estudos Concluídos",
    currentIp: "Saldo de IP",
    prefTitle: "Seus Gostos de Estudo",
    prefDesc: "Como você prefere que a IA explique os conteúdos?",
    prefPlaceholder: "Ex: 'Use exemplos práticos', 'Seja muito técnico', 'Linguagem divertida'...",
    savePref: "Salvar Preferências",
    prefSaved: "Preferências salvas!",
    recentActivity: "Atividade Recente",
    newStudy: "Novo Estudo",
    viewAll: "Ver tudo",
    unlimited: "Infinito",
    noActivity: "Nenhuma atividade recente."
  },
  en: {
    welcome: "Good morning,",
    stats: "Your Stats",
    totalStudies: "Completed Studies",
    currentIp: "IP Balance",
    prefTitle: "Your Study Tastes",
    prefDesc: "How do you prefer the AI to explain contents?",
    prefPlaceholder: "Ex: 'Use practical examples', 'Be very technical', 'Funny language'...",
    savePref: "Save Preferences",
    prefSaved: "Preferences saved!",
    recentActivity: "Recent Activity",
    newStudy: "New Study",
    viewAll: "View all",
    unlimited: "Unlimited",
    noActivity: "No recent activity."
  }
};

const Dashboard: React.FC<DashboardProps> = ({ 
  user, history, onUpdatePreferences, onNavigateToHistory, onNavigateToNewStudy, isDark, lang 
}) => {
  const [prefInput, setPrefInput] = useState(user.preferences || "");
  const [savedStatus, setSavedStatus] = useState(false);
  const t = translations[lang];

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase().trim());

  const handleSave = () => {
    onUpdatePreferences(prefInput);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            {t.welcome} <span className="text-indigo-500">{user.name.split(' ')[0]}!</span>
            <Zap className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Acompanhe seu progresso intelectual.</p>
        </div>
        <button 
          onClick={onNavigateToNewStudy}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <BookOpen className="w-5 h-5" />
          {t.newStudy}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-bold">{t.totalStudies}</h3>
          </div>
          <div className="text-4xl font-black">{history.length}</div>
        </div>

        <div className={`p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold">{t.currentIp}</h3>
          </div>
          <div className="text-4xl font-black flex items-center gap-2">
            {isAdmin ? (
              <span className="text-indigo-400">∞</span>
            ) : (
              user.points
            )}
            <span className="text-sm font-bold text-slate-500">IP</span>
          </div>
        </div>

        <div className={`md:col-span-2 lg:col-span-1 p-6 rounded-[2rem] border transition-all ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold">{t.prefTitle}</h3>
          </div>
          <div className="space-y-3">
            <textarea 
              value={prefInput}
              onChange={(e) => setPrefInput(e.target.value)}
              placeholder={t.prefPlaceholder}
              className={`w-full h-24 p-4 rounded-xl text-sm resize-none outline-none focus:border-indigo-500 border-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
            />
            <button 
              onClick={handleSave}
              className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${savedStatus ? 'bg-emerald-500 text-white' : 'bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600 hover:text-white'}`}
            >
              <Save className="w-4 h-4" />
              {savedStatus ? t.prefSaved : t.savePref}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            {t.recentActivity}
          </h3>
          <button onClick={onNavigateToHistory} className="text-sm font-bold text-indigo-500 hover:underline">{t.viewAll}</button>
        </div>

        {history.length === 0 ? (
          <div className={`p-10 text-center rounded-3xl border-2 border-dashed ${isDark ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
            {t.noActivity}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.slice(0, 4).map((item) => (
              <div 
                key={item.id}
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all hover:border-indigo-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate text-sm">{item.topic}</h4>
                  <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
