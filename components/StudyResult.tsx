
import React, { useState } from 'react';
import { 
  FileText, 
  HelpCircle, 
  Layers, 
  MessageSquare, 
  ChevronRight, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Book,
  Mic,
  Trophy,
  RefreshCw
} from 'lucide-react';
import { StudyMode, StudyFile, AnalysisResult, QuizQuestion, Flashcard, StudyContent, Language } from '../types';
import * as gemini from '../services/geminiService';
import { LiveTutor } from './LiveTutor';

interface StudyResultProps {
  files: StudyFile[];
  textContent?: string;
  analysis: AnalysisResult;
  initialMode: StudyMode;
  onBack: () => void;
  isDark?: boolean;
  lang: Language;
}

const translations = {
  pt: {
    topic: "Tópico Identificado",
    summaryTitle: "Resumo Inteligente",
    summaryDesc: "Os pontos mais importantes explicados de forma clara.",
    liveTitle: "Explicação em Live",
    liveDesc: "Fale com o Tutor IA e tire dúvidas em tempo real.",
    quizTitle: "Simulado Rápido",
    quizDesc: "Teste seus conhecimentos com questões geradas na hora.",
    flashTitle: "Flashcards de Revisão",
    flashDesc: "Ideal para memorizar conceitos e termos difíceis.",
    explainTitle: "Explicação Simples",
    explainDesc: "Entenda o conteúdo através de analogias fáceis (ELI5).",
    loading: "Gerando conteúdo personalizado...",
    simpleExpTitle: "Entendendo de forma simples",
    simpleExpSub: "Conceitos explicados através de analogias intuitivas.",
    explanation: "Explicação:",
    scoreFinal: "Sua nota final no simulado",
    resultBtn: "Ver Resultado & Nota",
    retryQuiz: "Refazer Simulado",
    reveal: "Toque para revelar",
    backCard: "Toque para voltar",
    scoreExcellent: "Excelente!",
    scoreGood: "Bom trabalho!",
    scoreImprove: "Pode melhorar.",
    scoreReview: "Precisa revisar."
  },
  en: {
    topic: "Identified Topic",
    summaryTitle: "Smart Summary",
    summaryDesc: "The most important points explained clearly.",
    liveTitle: "Live Explanation",
    liveDesc: "Talk to the AI Tutor and ask questions in real-time.",
    quizTitle: "Quick Quiz",
    quizDesc: "Test your knowledge with on-the-spot generated questions.",
    flashTitle: "Review Flashcards",
    flashDesc: "Ideal for memorizing difficult concepts and terms.",
    explainTitle: "Simple Explanation",
    explainDesc: "Understand content through easy analogies (ELI5).",
    loading: "Generating personalized content...",
    simpleExpTitle: "Understanding simply",
    simpleExpSub: "Concepts explained through intuitive analogies.",
    explanation: "Explanation:",
    scoreFinal: "Your final quiz grade",
    resultBtn: "See Results & Grade",
    retryQuiz: "Retake Quiz",
    reveal: "Tap to reveal",
    backCard: "Tap to go back",
    scoreExcellent: "Excellent!",
    scoreGood: "Good work!",
    scoreImprove: "Can improve.",
    scoreReview: "Needs review."
  }
};

const StudyResult: React.FC<StudyResultProps> = ({ files, textContent, analysis, initialMode, onBack, isDark, lang }) => {
  const [currentMode, setCurrentMode] = useState<StudyMode>(StudyMode.READY);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [explanation, setExplanation] = useState<string>("");

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const t = translations[lang];

  const fetchContent = async (mode: StudyMode) => {
    if (mode === StudyMode.LIVE) {
      setCurrentMode(mode);
      return;
    }
    setLoading(true);
    setCurrentMode(mode);
    const content = { files, text: textContent, language: lang };
    try {
      if (mode === StudyMode.SUMMARY && !summary) setSummary(await gemini.generateSummary(content));
      else if (mode === StudyMode.QUIZ && quiz.length === 0) setQuiz(await gemini.generateQuiz(content));
      else if (mode === StudyMode.FLASHCARDS && flashcards.length === 0) setFlashcards(await gemini.generateFlashcards(content));
      else if (mode === StudyMode.EXPLANATION && !explanation) setExplanation(await gemini.generateExplanation(content));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    if (!quiz.length) return 0;
    let correct = 0;
    quiz.forEach((q, idx) => { if (quizAnswers[idx] === q.correctAnswer) correct++; });
    return (correct / quiz.length) * 10;
  };

  const getScoreFeedback = (score: number) => {
    if (score >= 9) return { text: t.scoreExcellent, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    if (score >= 7) return { text: t.scoreGood, color: "text-blue-500", bg: "bg-blue-500/10" };
    if (score >= 5) return { text: t.scoreImprove, color: "text-amber-500", bg: "bg-amber-500/10" };
    return { text: t.scoreReview, color: "text-red-500", bg: "bg-red-500/10" };
  };

  const menuItems = [
    { mode: StudyMode.SUMMARY, icon: FileText, title: t.summaryTitle, desc: t.summaryDesc, color: "text-blue-500", bg: isDark ? "bg-blue-500/10" : "bg-blue-50" },
    { mode: StudyMode.LIVE, icon: Mic, title: t.liveTitle, desc: t.liveDesc, color: "text-rose-500", bg: isDark ? "bg-rose-500/10" : "bg-rose-50" },
    { mode: StudyMode.QUIZ, icon: HelpCircle, title: t.quizTitle, desc: t.quizDesc, color: "text-emerald-500", bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50" },
    { mode: StudyMode.FLASHCARDS, icon: Layers, title: t.flashTitle, desc: t.flashDesc, color: "text-amber-500", bg: isDark ? "bg-amber-500/10" : "bg-amber-50" },
    { mode: StudyMode.EXPLANATION, icon: MessageSquare, title: t.explainTitle, desc: t.explainDesc, color: "text-purple-500", bg: isDark ? "bg-purple-500/10" : "bg-purple-50" },
  ];

  if (currentMode === StudyMode.LIVE) {
    return <LiveTutor topic={analysis.topic} context={summary || analysis.description} onClose={() => setCurrentMode(StudyMode.READY)} isDark={isDark} lang={lang} />;
  }

  if (currentMode === StudyMode.READY) {
    const firstImage = files.find(f => f.mimeType.startsWith('image/'))?.base64;
    return (
      <div className="space-y-8 animate-slide-up">
        <div className={`rounded-3xl p-8 border shadow-xl flex flex-col md:flex-row items-center gap-8 transition-all hover:shadow-2xl ${isDark ? 'bg-slate-900/40 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200'}`}>
          <div className={`w-full md:w-2/5 aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center shadow-lg group ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {firstImage ? (
              <img src={firstImage} alt="Capa" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Book className={`w-16 h-16 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{files.length} {files.length === 1 ? 'Arquivo' : 'Arquivos'}</span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-500 text-xs font-black rounded-full uppercase tracking-widest animate-pulse-subtle">
              <Sparkles className="w-4 h-4" />
              {t.topic}
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">{analysis.topic}</h2>
            <p className={`text-lg leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{analysis.description}</p>
            <div className="pt-4 flex items-start gap-2 text-indigo-500 font-bold bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 italic">
              <span className="text-xl">💡</span>
              <span className="text-sm">{analysis.suggestion}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item, idx) => (
            <button
              key={item.mode}
              onClick={() => fetchContent(item.mode)}
              style={{ animationDelay: `${idx * 0.1}s` }}
              className={`group p-6 rounded-[2rem] border transition-all text-left flex items-start gap-5 shadow-lg hover:-translate-y-1.5 hover:shadow-2xl hover:border-indigo-500 animate-slide-up ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <div className={`${item.bg} ${item.color} p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                <item.icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1 tracking-tight">{item.title}</h3>
                <p className={`text-sm leading-snug font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.desc}</p>
              </div>
              <div className={`mt-1.5 p-1 rounded-full bg-slate-500/5 group-hover:bg-indigo-500 group-hover:text-white transition-colors`}>
                <ChevronRight className="w-5 h-5 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setCurrentMode(StudyMode.READY)} className={`p-3 rounded-full transition-all hover:scale-110 active:scale-90 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-slate-50'}`}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-black tracking-tight">{menuItems.find(i => i.mode === currentMode)?.title}</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="relative">
             <div className="absolute inset-0 bg-indigo-500/20 blur-2xl animate-pulse"></div>
             <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative" />
          </div>
          <p className="text-lg font-bold text-slate-500 animate-pulse">{t.loading}</p>
        </div>
      ) : (
        <div className={`rounded-3xl border shadow-2xl overflow-hidden transition-all animate-scale-in ${isDark ? 'bg-slate-900/60 border-slate-800 backdrop-blur-md' : 'bg-white border-slate-200'}`}>
          {currentMode === StudyMode.SUMMARY && (
            <div className={`p-8 md:p-12 prose max-w-none ${isDark ? 'prose-invert text-slate-300' : 'prose-slate text-slate-700'}`}>
              <div className="space-y-6">
                {summary.split('\n').map((line, i) => {
                   const cleanLine = line.replace(/^#+ /, '');
                   if (line.startsWith('# ')) return <h1 key={i} className="text-4xl font-black mb-6 tracking-tight">{cleanLine}</h1>;
                   if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black mt-8 mb-4 border-b border-slate-700/20 pb-2">{cleanLine}</h2>;
                   if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-6 mb-2 text-indigo-400">{cleanLine}</h3>;
                   if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-6 list-disc marker:text-indigo-500 font-medium">{line.substring(2)}</li>;
                   if (line.trim() === "") return <div key={i} className="h-4"></div>;
                   return <p key={i} className="text-lg leading-relaxed mb-6 font-medium">{line}</p>;
                })}
              </div>
            </div>
          )}

          {currentMode === StudyMode.EXPLANATION && (
            <div className="p-8 md:p-12">
              <div className={`flex items-center gap-5 mb-8 p-6 rounded-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                <MessageSquare className="w-10 h-10 text-purple-500 animate-float" />
                <div>
                  <h3 className={`text-xl font-black ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>{t.simpleExpTitle}</h3>
                  <p className={`font-medium ${isDark ? 'text-purple-400/80' : 'text-purple-700/80'}`}>{t.simpleExpSub}</p>
                </div>
              </div>
              <div className={`space-y-6 text-xl leading-relaxed italic font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {explanation.split('\n').map((p, i) => p && <p key={i} className="mb-6 first-letter:text-3xl first-letter:font-black first-letter:text-indigo-500">{p}</p>)}
              </div>
            </div>
          )}

          {currentMode === StudyMode.QUIZ && (
            <div className="p-8 space-y-12">
              {showQuizResults && (
                <div className={`flex flex-col items-center justify-center p-12 rounded-[3rem] animate-scale-in shadow-inner ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 border-[6px] shadow-2xl transition-all ${getScoreFeedback(calculateScore()).color} border-current`}>
                    <span className="text-4xl font-black tracking-tighter">{calculateScore().toFixed(1)}</span>
                  </div>
                  <h3 className={`text-3xl font-black ${getScoreFeedback(calculateScore()).color}`}>{getScoreFeedback(calculateScore()).text}</h3>
                  <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">{t.scoreFinal}</p>
                </div>
              )}
              {quiz.map((q, qIdx) => (
                <div key={qIdx} className="space-y-5 animate-slide-up" style={{ animationDelay: `${qIdx * 0.1}s` }}>
                  <h4 className="text-xl font-black flex gap-4 leading-snug">
                    <span className={`w-9 h-9 flex items-center justify-center rounded-2xl shrink-0 text-lg font-black shadow-sm ${isDark ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>{qIdx + 1}</span>
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 gap-3 ml-12">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = quizAnswers[qIdx] === oIdx;
                      const isCorrect = q.correctAnswer === oIdx;
                      let btnClass = "text-left p-5 rounded-2xl border-2 transition-all font-bold text-lg ";
                      if (showQuizResults) {
                        if (isCorrect) btnClass += isDark ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-800";
                        else if (isSelected && !isCorrect) btnClass += isDark ? "bg-red-500/20 border-red-500/50 text-red-300" : "bg-red-50 border-red-300 text-red-800";
                        else btnClass += isDark ? "bg-slate-800/50 border-slate-800 text-slate-700 opacity-40" : "bg-slate-50 border-slate-100 text-slate-400";
                      } else {
                        btnClass += isSelected 
                          ? (isDark ? "bg-indigo-600 border-indigo-500 text-white shadow-xl scale-[1.02]" : "bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]")
                          : (isDark ? "bg-slate-800/50 border-slate-800 text-slate-300 hover:border-indigo-500/50" : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50");
                      }
                      return (
                        <button key={oIdx} disabled={showQuizResults} onClick={() => setQuizAnswers({...quizAnswers, [qIdx]: oIdx})} className={btnClass}>
                          <div className="flex items-center justify-between"><span>{opt}</span>{showQuizResults && isCorrect && <CheckCircle2 className="w-6 h-6 animate-scale-in" />}</div>
                        </button>
                      );
                    })}
                  </div>
                  {showQuizResults && (
                    <div className={`ml-12 p-6 rounded-3xl text-base border-l-8 border-indigo-600 font-medium animate-slide-up ${isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                      <strong className="text-indigo-500 block mb-1 uppercase tracking-widest text-xs font-black">{t.explanation}</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-center pt-8">
                {!showQuizResults ? (
                  <button disabled={Object.keys(quizAnswers).length < quiz.length} onClick={() => setShowQuizResults(true)} className="bg-indigo-600 text-white px-14 py-4 rounded-full font-black text-xl shadow-2xl hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-40">
                    {t.resultBtn}
                  </button>
                ) : (
                  <button onClick={() => {setQuizAnswers({}); setShowQuizResults(false);}} className="text-indigo-500 font-black hover:scale-110 active:scale-90 transition-all text-lg flex items-center gap-3">
                    <Trophy className="w-6 h-6 animate-float" />{t.retryQuiz}
                  </button>
                )}
              </div>
            </div>
          )}

          {currentMode === StudyMode.FLASHCARDS && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {flashcards.map((card, i) => (
                  <FlashcardItem key={i} card={card} isDark={isDark} lang={lang} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* FlashcardItem component using the RefreshCw icon */
const FlashcardItem: React.FC<{ card: Flashcard; isDark?: boolean; lang: Language; index: number }> = ({ card, isDark, lang, index }) => {
  const [flipped, setFlipped] = useState(false);
  const t = translations[lang];
  return (
    <div onClick={() => setFlipped(!flipped)} style={{ animationDelay: `${index * 0.1}s` }} className="h-72 perspective-1000 cursor-pointer group animate-slide-up">
      <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${flipped ? 'rotate-y-180 shadow-2xl' : 'shadow-xl'} rounded-[2rem]`}>
        <div className={`absolute inset-0 backface-hidden border-2 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center transition-all group-hover:border-indigo-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="p-3 rounded-2xl bg-indigo-500/10 mb-6 group-hover:scale-125 transition-transform"><Layers className="w-8 h-8 text-indigo-500 opacity-80" /></div>
          <h4 className="text-xl font-black leading-tight tracking-tight">{card.front}</h4>
          <div className="absolute bottom-6 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-500" /><p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{t.reveal}</p></div>
        </div>
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-purple-700 border-2 border-indigo-600 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center rotate-y-180">
          <p className="text-white text-xl font-bold leading-relaxed">{card.back}</p>
          <div className="absolute bottom-6 flex items-center gap-1.5"><RefreshCw className="w-3 h-3 text-white/50" /><p className="text-white/60 text-[10px] uppercase tracking-widest font-black">{t.backCard}</p></div>
        </div>
      </div>
    </div>
  );
};

export default StudyResult;
