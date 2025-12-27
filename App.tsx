
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Brain, 
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { StudyFile, StudyMode, AnalysisResult, Language, User, StudyHistoryEntry, AppLog } from './types';
import * as gemini from './services/geminiService';
import * as cloud from './services/cloudStore';
import FileUpload from './components/FileUpload';
import StudyResult from './components/StudyResult';
import LoginModal from './components/LoginModal';
import PointsManager from './components/PointsManager';
import Dashboard from './components/Dashboard';
import StudyHistory from './components/StudyHistory';
import DebugConsole from './components/DebugConsole';

const BANNED_EMAIL = "samuelribeiropassos@gmail.com";
const ADMIN_EMAILS = ["samuelribeiropassos@icloud.com", "cassiuspereirahector@gmail.com"];

const translations = {
  pt: {
    welcome: "Transforme documentos ou texto em",
    welcomeHighlight: "conhecimento",
    welcomeSub: "Conectado ao PostgreSQL Real. Seus dados estão seguros e sincronizados.",
    files: "Arquivos",
    text: "Texto",
    placeholder: "Cole aqui o conteúdo que você quer estudar (ex: um capítulo de livro, suas anotações, etc...)",
    errorFile: "Por favor, adicione pelo menos um arquivo (Imagem ou PDF).",
    errorText: "Por favor, digite ou cole um texto de estudo.",
    errorNotStudy: "Este conteúdo não parece ser material de estudo acadêmico.",
    errorGeneral: "Erro de IA detectado. Abra o Console de Debug para ver detalhes.",
    errorNoPoints: "Saldo de IP insuficiente. Adquira mais na carteira!",
    startBtn: "Começar a Estudar",
    analyzing: "IA Analisando Material...",
    footer: "PrimarralAI • PostgreSQL Sincronizado.",
    errorBanned: "ESTA CONTA FOI BANIDA PERMANENTEMENTE.",
    syncing: "Sincronizando com Banco de Dados...",
    errorAuth: "Sua chave de API parece inválida ou não foi configurada."
  },
  en: {
    welcome: "Transform documents or text into",
    welcomeHighlight: "knowledge",
    welcomeSub: "Connected to Real PostgreSQL. Your data is secure and synced.",
    files: "Files",
    text: "Text",
    placeholder: "Paste the content you want to study here...",
    errorFile: "Please add at least one file.",
    errorText: "Please type or paste study text.",
    errorNotStudy: "This doesn't seem to be study material.",
    errorGeneral: "AI Error detected. Open Debug Console for details.",
    errorNoPoints: "Insufficient IP balance. Buy more in the wallet!",
    startBtn: "Start Studying",
    analyzing: "AI Analyzing Material...",
    footer: "PrimarralAI • PostgreSQL Synced.",
    errorBanned: "THIS ACCOUNT HAS BEEN PERMANENTLY BANNED.",
    syncing: "Syncing with Database...",
    errorAuth: "Your API Key seems invalid or not configured."
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [mode, setMode] = useState<StudyMode>(StudyMode.IDLE);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<StudyHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<AppLog[]>([]);
  
  const [lang] = useState<Language>(() => (localStorage.getItem('primarral_lang') as Language) || 'pt');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('primarral_theme') as 'light' | 'dark') || 'dark');

  const isUserAdmin = useCallback((email?: string) => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase().trim());
  }, []);

  const addLog = useCallback((type: AppLog['type'], message: string, errorObj?: any) => {
    let finalMessage = message;
    if (errorObj instanceof Error) {
      finalMessage += ` | Details: ${errorObj.message}`;
    }

    const newLog: AppLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      message: finalMessage,
      details: errorObj
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const loadHistory = useCallback(async (email: string) => {
    setIsSyncing(true);
    try {
      const data = await cloud.getGlobalHistory(email);
      setHistory(data);
    } catch (e) {
      addLog('error', 'Falha ao carregar histórico do banco', e);
    } finally {
      setIsSyncing(false);
    }
  }, [addLog]);

  useEffect(() => {
    const savedUser = localStorage.getItem('primarral_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (mode === StudyMode.IDLE) setMode(StudyMode.DASHBOARD);
      loadHistory(parsedUser.email);
    }
  }, [loadHistory]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('primarral_theme', theme);
  }, [theme]);

  const t = translations[lang];

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('primarral_user');
    setMode(StudyMode.IDLE);
    setHistory([]);
  };

  const handlePurchaseSuccess = async (addedPoints: number) => {
    if (!user) return;
    const newPoints = user.points + addedPoints;
    const updatedUser = { ...user, points: newPoints };
    setUser(updatedUser);
    localStorage.setItem('primarral_user', JSON.stringify(updatedUser));
    await cloud.syncUserData(user.email, { points: newPoints });
    addLog('info', `DB Sync: +${addedPoints} IP salvos no banco.`);
  };

  const startStudy = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    const admin = isUserAdmin(user.email);

    if (user.email.toLowerCase().trim() === BANNED_EMAIL) {
      setError(t.errorBanned);
      setTimeout(() => handleLogout(), 2500);
      return;
    }

    // Se NÃO for admin e pontos forem 0, bloqueia
    if (!admin && user.points <= 0) {
      setError(t.errorNoPoints);
      return;
    }

    const hasFiles = inputMode === 'file' && files.length > 0;
    const hasText = inputMode === 'text' && textInput.trim().length > 10;
    
    if (!hasFiles && !hasText) {
      setError(inputMode === 'file' ? t.errorFile : t.errorText);
      return;
    }

    setMode(StudyMode.ANALYZING);
    setLoadingMsg(t.analyzing);
    setError(null);
    addLog('ai', 'Iniciando análise de conteúdo...');

    const content = {
      files: inputMode === 'file' ? files : [],
      text: inputMode === 'text' ? textInput : undefined,
      language: lang,
      userPreferences: user.preferences
    };

    try {
      const result = await gemini.analyzeContent(content);
      addLog('ai', 'Análise concluída com sucesso', result);

      if (!result.isStudyMaterial) {
        setError(t.errorNotStudy);
        setMode(StudyMode.IDLE);
        return;
      }
      
      // LÓGICA CORRIGIDA: Só subtrai se NÃO for admin
      if (!admin) {
        const newPoints = Math.max(0, user.points - 1);
        const updatedUser = { ...user, points: newPoints };
        setUser(updatedUser);
        localStorage.setItem('primarral_user', JSON.stringify(updatedUser));
        await cloud.syncUserData(user.email, { points: newPoints });
      }

      // Salvar no histórico remoto
      const historyEntry: StudyHistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        date: Date.now(),
        topic: result.topic,
        description: result.description,
        files: inputMode === 'file' ? files : [],
        text: inputMode === 'text' ? textInput : undefined,
        analysis: result
      };

      const newHistory = [historyEntry, ...history];
      setHistory(newHistory);
      await cloud.saveGlobalHistory(user.email, newHistory);
      
      setAnalysis(result);
      setMode(StudyMode.READY);
    } catch (err: any) {
      console.error(err);
      addLog('error', 'Falha na Análise Gemini', err);
      
      // Checa se é erro de API KEY
      if (err.message?.includes('400') || err.message?.includes('API key not valid')) {
        setError(t.errorAuth);
      } else if (err.message === "API_KEY_MISSING") {
        setError(t.errorAuth);
      } else {
        setError(t.errorGeneral);
      }
      
      setMode(StudyMode.IDLE);
    }
  };

  const handleSelectHistoryItem = (entry: StudyHistoryEntry) => {
    setFiles(entry.files);
    setTextInput(entry.text || "");
    setAnalysis(entry.analysis);
    setMode(StudyMode.READY);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`border-b sticky top-0 z-50 transition-all ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-white/80 border-slate-200 backdrop-blur-md shadow-sm'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setMode(user ? StudyMode.DASHBOARD : StudyMode.IDLE)}>
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
               <h1 className="text-xl font-bold tracking-tight">PrimarralAI</h1>
               {isSyncing && <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 animate-pulse"><Loader2 size={8} className="animate-spin" /> DB Sincronizado</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-1">
                <button onClick={() => setIsPointsModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="font-black text-sm">{isUserAdmin(user.email) ? "∞" : user.points} IP</span>
                </button>
                <button onClick={() => setMode(StudyMode.DASHBOARD)} className={`p-2 rounded-xl ${mode === StudyMode.DASHBOARD ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                <button onClick={handleLogout} className="p-2 rounded-xl text-slate-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-xl bg-slate-800 text-amber-400">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {(mode === StudyMode.IDLE) && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-5xl font-black">
                {t.welcome} <span className="text-indigo-500">{t.welcomeHighlight}</span>
              </h2>
              <p className="max-w-xl mx-auto text-slate-500 font-medium">{t.welcomeSub}</p>
            </div>

            <div className="flex justify-center gap-1 p-1 bg-slate-900 rounded-2xl w-fit mx-auto">
              <button onClick={() => setInputMode('file')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${inputMode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{t.files}</button>
              <button onClick={() => setInputMode('text')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${inputMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{t.text}</button>
            </div>

            <div className="min-h-[300px] animate-scale-in">
              {inputMode === 'file' ? (
                <FileUpload files={files} onFilesChange={setFiles} isDark={theme === 'dark'} lang={lang} />
              ) : (
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full h-64 p-6 rounded-3xl border-2 bg-slate-900 border-slate-800 outline-none focus:border-indigo-500 transition-all text-lg"
                />
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 font-bold flex flex-col items-center gap-2 animate-bounce">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> {error}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button onClick={startStudy} className="group px-12 py-5 rounded-full font-black text-xl bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 shadow-2xl shadow-indigo-500/30">
                <BookOpen className="w-6 h-6 inline-block mr-2" />
                {t.startBtn}
              </button>
            </div>
          </div>
        )}

        <div className="view-transition">
          {mode === StudyMode.DASHBOARD && user && (
            <Dashboard 
              user={user} 
              history={history} 
              onUpdatePreferences={(p) => {
                const updated = { ...user, preferences: p };
                setUser(updated);
                localStorage.setItem('primarral_user', JSON.stringify(updated));
                cloud.syncUserData(user.email, { preferences: p });
              }} 
              onNavigateToHistory={() => setMode(StudyMode.HISTORY)} 
              onNavigateToNewStudy={() => setMode(StudyMode.IDLE)} 
              isDark={theme === 'dark'} 
              lang={lang} 
            />
          )}
          {mode === StudyMode.HISTORY && user && (
            <StudyHistory 
              userEmail={user.email} 
              onSelect={handleSelectHistoryItem} 
              onBack={() => setMode(StudyMode.DASHBOARD)} 
              isDark={theme === 'dark'} 
              lang={lang} 
            />
          )}
          {mode === StudyMode.ANALYZING && (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600/20 blur-2xl animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative" />
              </div>
              <h3 className="text-xl font-bold animate-pulse">{loadingMsg}</h3>
            </div>
          )}
          {mode === StudyMode.READY && analysis && (
            <StudyResult 
              files={files} 
              textContent={textInput} 
              analysis={analysis} 
              initialMode={mode} 
              onBack={() => setMode(StudyMode.IDLE)} 
              isDark={theme === 'dark'} 
              lang={lang} 
            />
          )}
        </div>
      </main>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={(u) => { setUser(u); setMode(StudyMode.DASHBOARD); loadHistory(u.email); }} isDark={theme === 'dark'} lang={lang} />
      {user && (
        <PointsManager 
          isOpen={isPointsModalOpen} 
          onClose={() => setIsPointsModalOpen(false)} 
          points={user.points} 
          onRedeem={async () => false} 
          onPurchaseSuccess={handlePurchaseSuccess}
          isDark={theme === 'dark'} 
          lang={lang} 
          userEmail={user.email}
        />
      )}
      
      <DebugConsole logs={logs} onClear={() => setLogs([])} isDark={theme === 'dark'} />
    </div>
  );
};

export default App;
