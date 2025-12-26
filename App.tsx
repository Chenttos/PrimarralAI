
import React, { useState, useEffect } from 'react';
import { 
  Upload, 
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
  Globe
} from 'lucide-react';
import { StudyImage, StudyMode, AnalysisResult, Language } from './types.ts';
import * as gemini from './services/geminiService.ts';
import FileUpload from './components/FileUpload.tsx';
import StudyResult from './components/StudyResult.tsx';
import DeveloperModal from './components/DeveloperModal.tsx';

const translations = {
  pt: {
    welcome: "Transforme fotos ou texto em",
    welcomeHighlight: "conhecimento",
    welcomeSub: "Envie seu material e deixe nossa IA criar resumos, quizzes e flashcards personalizados.",
    reset: "Recomeçar",
    photos: "Fotos",
    text: "Texto",
    placeholder: "Cole aqui o conteúdo que você quer estudar (ex: um capítulo de livro, suas anotações, etc...)",
    minChars: "Mínimo de 10 caracteres.",
    errorImage: "Por favor, adicione pelo menos uma imagem.",
    errorText: "Por favor, digite ou cole um texto de estudo.",
    errorNotStudy: "Este conteúdo não parece ser material de estudo acadêmico. Tente enviar algo relacionado a livros, cadernos ou tópicos educativos.",
    errorGeneral: "Erro ao processar conteúdo. Verifique sua conexão.",
    startBtn: "Começar a Estudar",
    analyzing: "Analisando seu material de estudo...",
    reading: "Nossa IA está lendo seu material...",
    footer: "PrimarralAI • Transformando material bruto em aprendizado ágil."
  },
  en: {
    welcome: "Transform photos or text into",
    welcomeHighlight: "knowledge",
    welcomeSub: "Upload your material and let our AI create personalized summaries, quizzes, and flashcards.",
    reset: "Reset",
    photos: "Photos",
    text: "Text",
    placeholder: "Paste the content you want to study here (e.g., a book chapter, your notes, etc...)",
    minChars: "Minimum 10 characters.",
    errorImage: "Please add at least one image.",
    errorText: "Please type or paste study text.",
    errorNotStudy: "This content doesn't seem to be academic study material. Try uploading something related to books, notebooks, or educational topics.",
    errorGeneral: "Error processing content. Check your connection.",
    startBtn: "Start Studying",
    analyzing: "Analyzing your study material...",
    reading: "Our AI is reading your material...",
    footer: "PrimarralAI • Transforming raw material into agile learning."
  }
};

const App: React.FC = () => {
  const [images, setImages] = useState<StudyImage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image');
  const [mode, setMode] = useState<StudyMode>(StudyMode.IDLE);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    return localStorage.getItem('lang') as Language || 'pt';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'pt' ? 'en' : 'pt');

  const handleImagesChange = (newImages: StudyImage[]) => {
    setImages(newImages);
    setError(null);
  };

  const startStudy = async () => {
    const hasImages = inputMode === 'image' && images.length > 0;
    const hasText = inputMode === 'text' && textInput.trim().length > 10;

    if (!hasImages && !hasText) {
      setError(inputMode === 'image' ? t.errorImage : t.errorText);
      return;
    }
    
    setMode(StudyMode.ANALYZING);
    setLoadingMsg(t.analyzing);
    setError(null);

    const content = {
      images: inputMode === 'image' ? images : [],
      text: inputMode === 'text' ? textInput : undefined,
      language: lang
    };

    try {
      const result = await gemini.analyzeContent(content);
      if (!result.isStudyMaterial) {
        setError(t.errorNotStudy);
        setMode(StudyMode.IDLE);
        return;
      }
      setAnalysis(result);
      setMode(StudyMode.READY);
    } catch (err) {
      console.error(err);
      setError(t.errorGeneral);
      setMode(StudyMode.IDLE);
    }
  };

  const reset = () => {
    setImages([]);
    setTextInput("");
    setMode(StudyMode.IDLE);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800 backdrop-blur-md' : 'bg-white/80 border-slate-200 backdrop-blur-md'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">PrimarralAI</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {mode !== StudyMode.IDLE && (
              <button 
                onClick={reset}
                className="text-sm font-medium text-indigo-500 hover:text-indigo-400 flex items-center gap-1 px-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">{t.reset}</span>
              </button>
            )}
            
            <button 
              onClick={toggleLang}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold uppercase ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title="Change Language"
            >
              <Globe className="w-4 h-4" />
              {lang}
            </button>

            <button 
              onClick={() => setIsDevModalOpen(true)}
              className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title="Informações do Desenvolvedor"
            >
              <Info className="w-5 h-5" />
            </button>

            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200'}`}
              aria-label="Alternar Tema"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {mode === StudyMode.IDLE && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-extrabold">
                {t.welcome} <span className="text-indigo-500">{t.welcomeHighlight}</span>
              </h2>
              <p className={`max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.welcomeSub}
              </p>
            </div>

            <div className="flex justify-center p-1">
              <div className={`flex p-1 rounded-2xl ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-200/50'}`}>
                <button
                  onClick={() => setInputMode('image')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${inputMode === 'image' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
                >
                  <ImageIcon className="w-4 h-4" /> {t.photos}
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${inputMode === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
                >
                  <TypeIcon className="w-4 h-4" /> {t.text}
                </button>
              </div>
            </div>

            <div className="transition-all duration-300 min-h-[256px]">
              {inputMode === 'image' ? (
                <FileUpload images={images} onImagesChange={handleImagesChange} isDark={theme === 'dark'} lang={lang} />
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={t.placeholder}
                    className={`w-full h-64 p-6 rounded-2xl border-2 transition-all resize-none outline-none focus:border-indigo-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                  <p className="text-xs text-slate-500 text-right">{t.minChars}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-500 font-medium">{error}</p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={startStudy}
                className={`
                  flex items-center gap-2 px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl
                  bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 active:scale-95
                `}
              >
                <BookOpen className="w-6 h-6" />
                {t.startBtn}
              </button>
            </div>
          </div>
        )}

        {mode === StudyMode.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">{loadingMsg}</h3>
              <p className="text-slate-500 text-sm">{t.reading}</p>
            </div>
          </div>
        )}

        {mode !== StudyMode.IDLE && mode !== StudyMode.ANALYZING && (
          <StudyResult 
            images={images} 
            textContent={textInput}
            analysis={analysis!} 
            initialMode={mode}
            onBack={() => setMode(StudyMode.READY)}
            isDark={theme === 'dark'}
            lang={lang}
          />
        )}
      </main>

      <DeveloperModal 
        isOpen={isDevModalOpen} 
        onClose={() => setIsDevModalOpen(false)} 
        isDark={theme === 'dark'} 
        lang={lang}
      />

      <footer className={`py-8 border-t transition-colors duration-300 ${theme === 'dark' ? 'border-slate-800 text-slate-600' : 'border-slate-100 text-slate-400'}`}>
        <p className="text-center text-sm font-medium">
          {t.footer}
        </p>
      </footer>
    </div>
  );
};

export default App;
