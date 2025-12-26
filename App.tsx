
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Brain, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Sun,
  Moon,
  Type as TypeIcon,
  Image as ImageIcon,
  Info,
  Globe,
  User as UserIcon,
  LogOut,
  Sparkles,
  History as HistoryIcon,
  LayoutDashboard,
  Cloud,
  CloudUpload,
  Check
} from 'lucide-react';
import { StudyFile, StudyMode, AnalysisResult, Language, User, StudyHistoryEntry } from './types';
import * as gemini from './services/geminiService';
import * as cloud from './services/cloudStore';
import FileUpload from './components/FileUpload';
import StudyResult from './components/StudyResult';
import DeveloperModal from './components/DeveloperModal';
import LoginModal from './components/LoginModal';
import StudyHistory from './components/StudyHistory';
import PointsManager from './components/PointsManager';
import Dashboard from './components/Dashboard';

const ADMIN_EMAIL = "samuelribeiropassos@icloud.com";

const PROMO_CODES: Record<string, number> = {
  'PRIMARRAL2025': 100,
  'STUDYAI': 50,
  'GEMINI2': 25,
  'IPBONUS': 10
};

const translations = {
  pt: {
    welcome: "Transforme documentos ou texto em",
    welcomeHighlight: "conhecimento",
    welcomeSub: "Envie fotos de cadernos ou arquivos PDF e deixe nossa IA criar resumos e quizzes personalizados.",
    reset: "Recomeçar",
    files: "Arquivos",
    text: "Texto",
    placeholder: "Cole aqui o conteúdo que você quer estudar (ex: um capítulo de livro, suas anotações, etc...)",
    minChars: "Mínimo de 10 caracteres.",
    errorFile: "Por favor, adicione pelo menos um arquivo (Imagem ou PDF).",
    errorText: "Por favor, digite ou cole um texto de estudo.",
    errorNotStudy: "Este conteúdo não parece ser material de estudo acadêmico. Tente enviar algo relacionado a livros, cadernos ou tópicos educativos.",
    errorGeneral: "Erro ao processar conteúdo. Verifique sua conexão.",
    errorNoPoints: "Seu IP atingiu o limite de pontos. Resgate um código para continuar!",
    startBtn: "Começar a Estudar",
    analyzing: "Analisando seu material de estudo...",
    reading: "Nossa IA está lendo seu material...",
    footer: "PrimarralAI • Sincronização Global Ativa.",
    login: "Entrar",
    logout: "Sair",
    hello: "Olá,",
    welcomeBack: "Bem-vindo de volta,",
    history: "Histórico",
    earnedIP: "Parabéns! Você ganhou +1 IP por este estudo!",
    dashboard: "Painel",
    syncing: "Sincronizando...",
    synced: "Dados Salvos na Nuvem"
  },
  en: {
    welcome: "Transform documents or text into",
    welcomeHighlight: "knowledge",
    welcomeSub: "Upload photos of notebooks or PDF files and let our IA create personalized summaries and quizzes.",
    reset: "Reset",
    files: "Files",
    text: "Text",
    placeholder: "Paste the content you want to study here (e.g., a book chapter, your notes, etc...)",
    minChars: "Minimum 10 characters.",
    errorFile: "Please add at least one file (Image or PDF).",
    errorText: "Please type or paste study text.",
    errorNotStudy: "This content doesn't seem to be academic study material. Try uploading something related to books, notebooks, or educational topics.",
    errorGeneral: "Error processing content. Check your connection.",
    errorNoPoints: "Your IP reached the points limit. Redeem a code to continue!",
    startBtn: "Start Studying",
    analyzing: "Analyzing your study material...",
    reading: "Our AI is reading your material...",
    footer: "PrimarralAI • Global Sync Active.",
    login: "Login",
    logout: "Logout",
    hello: "Hello,",
    welcomeBack: "Welcome back,",
    history: "History",
    earnedIP: "Congrats! You earned +1 IP for this study!",
    dashboard: "Dashboard",
    syncing: "Syncing...",
    synced: "Cloud Data Saved"
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userIp, setUserIp] = useState<string>("unknown");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [mode, setMode] = useState<StudyMode>(StudyMode.IDLE);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [ipNotification, setIpNotification] = useState(false);
  const [history, setHistory] = useState<StudyHistoryEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('primarral_lang') as Language) || 'pt';
  });
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('primarral_theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  const t = translations[lang];

  useEffect(() => {
    const savedUser = localStorage.getItem('primarral_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setMode(StudyMode.DASHBOARD);
      handleSync(parsed.email, parsed);
    }
    
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(() => setUserIp("unknown"));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('primarral_theme', theme);
  }, [theme]);

  const handleSync = async (email: string, userData: Partial<User>) => {
    setIsSyncing(true);
    try {
      await cloud.syncUserData(email, userData);
      const cloudHistory = await cloud.getGlobalHistory(email);
      setHistory(cloudHistory);
    } catch (e) {
      console.error("Cloud Sync Error", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('primarral_user', JSON.stringify(user));
      if (userIp !== "unknown") {
        localStorage.setItem(`primarral_ip_points_${userIp}`, user.points.toString());
      }
      handleSync(user.email, user);
    } else {
      localStorage.removeItem('primarral_user');
      setHistory([]);
    }
  }, [user?.points, user?.preferences, userIp]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'pt' ? 'en' : 'pt');

  const updateUserPoints = (amount: number) => {
    if (!user) return;
    if (user.email === ADMIN_EMAIL) return; 
    const newPoints = Math.max(0, user.points + amount);
    setUser(prev => prev ? { ...prev, points: newPoints } : null);
  };

  const updateUserPreferences = (prefs: string) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, preferences: prefs } : null);
  };

  const handleRedeemCode = async (code: string): Promise<boolean> => {
    if (!user) return false;
    const usedCodesKey = `primarral_used_codes_${user.email}`;
    const usedCodes = JSON.parse(localStorage.getItem(usedCodesKey) || '[]');
    if (usedCodes.includes(code)) return false;
    const reward = PROMO_CODES[code];
    if (reward) {
      updateUserPoints(reward);
      localStorage.setItem(usedCodesKey, JSON.stringify([...usedCodes, code]));
      return true;
    }
    return false;
  };

  const handleLogin = async (newUser: User) => {
    setIsSyncing(true);
    const accounts = await cloud.getGlobalAccounts();
    const globalAcc = accounts.find(a => a.email.toLowerCase() === newUser.email.toLowerCase());
    
    const finalUser = globalAcc ? {
      ...newUser,
      points: globalAcc.points,
      preferences: globalAcc.preferences
    } : newUser;

    setUser(finalUser);
    const globalHistory = await cloud.getGlobalHistory(finalUser.email);
    setHistory(globalHistory);
    setMode(StudyMode.DASHBOARD);
    setIsSyncing(false);
  };

  const handleLogout = () => {
    setUser(null);
    setMode(StudyMode.IDLE);
  };

  const saveToHistory = async (result: AnalysisResult, currentFiles: StudyFile[], currentText: string) => {
    if (!user) return;
    const newEntry: StudyHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: Date.now(),
      topic: result.topic,
      description: result.description,
      files: currentFiles,
      text: currentText,
      analysis: result
    };

    const updatedHistory = [newEntry, ...history].slice(0, 50);
    setHistory(updatedHistory);
    setIsSyncing(true);
    await cloud.saveGlobalHistory(user.email, updatedHistory);
    setIsSyncing(false);
  };

  const startStudy = async () => {
    if (!user || !user.verified) {
      setIsLoginModalOpen(true);
      return;
    }
    if (user.points <= 0 && user.email !== ADMIN_EMAIL) {
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
    const content = {
      files: inputMode === 'file' ? files : [],
      text: inputMode === 'text' ? textInput : undefined,
      language: lang,
      userPreferences: user.preferences
    };
    try {
      const result = await gemini.analyzeContent(content);
      if (!result.isStudyMaterial) {
        setError(t.errorNotStudy);
        setMode(StudyMode.IDLE);
        return;
      }
      updateUserPoints(-1);
      setAnalysis(result);
      await saveToHistory(result, content.files, content.text || "");
      setMode(StudyMode.READY);
    } catch (err: any) {
      setError(t.errorGeneral);
      setMode(StudyMode.IDLE);
    }
  };

  const loadFromHistory = (entry: StudyHistoryEntry) => {
    setFiles(entry.files);
    setTextInput(entry.text || "");
    setAnalysis(entry.analysis);
    setMode(StudyMode.READY);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode(user ? StudyMode.DASHBOARD : StudyMode.IDLE)}>
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight leading-none">PrimarralAI</h1>
              {isSyncing && (
                <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1">
                  <CloudUpload className="w-2 h-2" /> {t.syncing}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <div className={`p-2 rounded-full ${isSyncing ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} title={isSyncing ? t.syncing : t.synced}>
                  {isSyncing ? <RefreshCw className="w-4 h-4" /> : (
                    <div className="relative">
                      <Cloud className="w-4 h-4" />
                      <Check className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full p-0.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setMode(StudyMode.DASHBOARD)}
                  className={`p-2 rounded-xl transition-all ${mode === StudyMode.DASHBOARD ? 'bg-indigo-600 text-white' : (theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')}`}
                  title={t.dashboard}
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => setIsPointsModalOpen(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-black text-sm">
                    {user.email === ADMIN_EMAIL ? "∞" : user.points} <span className="text-[10px]">IP</span>
                  </span>
                </button>
                
                <button 
                  onClick={() => setMode(StudyMode.HISTORY)}
                  className={`p-2 rounded-xl transition-all ${mode === StudyMode.HISTORY ? 'bg-indigo-600 text-white' : (theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}
                >
                  <HistoryIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2 md:gap-3 mr-2">
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-indigo-500/50" />
                <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-500">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">
                {t.login}
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsDevModalOpen(true)} 
                className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                title="Developer Info"
              >
                <Info className="w-4 h-4" />
              </button>
              <button onClick={toggleLang} className={`p-2 rounded-xl text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100'}`}>
                {lang}
              </button>
              <button onClick={toggleTheme} className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-indigo-600'}`}>
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {(mode === StudyMode.IDLE || (mode === StudyMode.DASHBOARD && !user)) && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
                {t.welcome} <span className="text-indigo-500">{t.welcomeHighlight}</span>
              </h2>
              <p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.welcomeSub}</p>
            </div>

            <div className="flex justify-center">
              <div className={`flex p-1 rounded-2xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-200/50'}`}>
                <button onClick={() => setInputMode('file')} className={`px-6 py-2.5 rounded-xl font-medium ${inputMode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                  {t.files}
                </button>
                <button onClick={() => setInputMode('text')} className={`px-6 py-2.5 rounded-xl font-medium ${inputMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                  {t.text}
                </button>
              </div>
            </div>

            <div className="transition-all duration-300 min-h-[256px]">
              {inputMode === 'file' ? (
                <FileUpload files={files} onFilesChange={newFiles => {setFiles(newFiles); setError(null);}} isDark={theme === 'dark'} lang={lang} />
              ) : (
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder={t.placeholder}
                  className={`w-full h-64 p-6 rounded-2xl border-2 outline-none focus:border-indigo-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200'}`}
                />
              )}
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-sm font-medium">{error}</div>}

            <div className="flex justify-center">
              <button onClick={startStudy} className="flex items-center gap-2 px-10 py-4 rounded-full font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95">
                <BookOpen className="w-6 h-6" />
                {t.startBtn}
              </button>
            </div>
          </div>
        )}

        {mode === StudyMode.DASHBOARD && user && (
          <Dashboard 
            user={user} 
            history={history} 
            onUpdatePreferences={updateUserPreferences}
            onNavigateToHistory={() => setMode(StudyMode.HISTORY)}
            onNavigateToNewStudy={() => setMode(StudyMode.IDLE)}
            isDark={theme === 'dark'}
            lang={lang}
          />
        )}

        {mode === StudyMode.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
            <h3 className="text-xl font-semibold">{loadingMsg}</h3>
          </div>
        )}

        {mode === StudyMode.HISTORY && user && (
          <StudyHistory userEmail={user.email} onSelect={loadFromHistory} isDark={theme === 'dark'} lang={lang} onBack={() => setMode(StudyMode.DASHBOARD)} />
        )}

        {mode !== StudyMode.IDLE && mode !== StudyMode.ANALYZING && mode !== StudyMode.HISTORY && mode !== StudyMode.DASHBOARD && (
          <StudyResult files={files} textContent={textInput} analysis={analysis!} initialMode={mode} onBack={() => setMode(StudyMode.READY)} isDark={theme === 'dark'} lang={lang} />
        )}
      </main>

      <DeveloperModal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} isDark={theme === 'dark'} lang={lang} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} isDark={theme === 'dark'} lang={lang} />
      {user && <PointsManager isOpen={isPointsModalOpen} onClose={() => setIsPointsModalOpen(false)} points={user.points} onRedeem={handleRedeemCode} isDark={theme === 'dark'} lang={lang} />}

      <footer className="py-8 border-t text-center text-sm font-medium text-slate-500">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
};

export default App;
