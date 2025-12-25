
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
  Trophy
} from 'lucide-react';
import { StudyMode, StudyImage, AnalysisResult, QuizQuestion, Flashcard, StudyContent, Language } from '../types';
import * as gemini from '../services/geminiService';
import { LiveTutor } from './LiveTutor';

interface StudyResultProps {
  images: StudyImage[];
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

const StudyResult: React.FC<StudyResultProps> = ({ images, textContent, analysis, initialMode, onBack, isDark, lang }) => {
  const [currentMode, setCurrentMode] = useState<StudyMode>(StudyMode.READY);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [explanation, setExplanation] = useState<string>("");

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const t = translations[lang];

  const getFullContent = (): StudyContent => ({
    images,
    text: textContent,
    language: lang
  });

  const fetchContent = async (mode: StudyMode) => {
    if (mode === StudyMode.LIVE) {
      setCurrentMode(mode);
      return;
    }
    setLoading(true);
    setCurrentMode(mode);
    const content = getFullContent();
    try {
      if (mode === StudyMode.SUMMARY && !summary) {
        setSummary(await gemini.generateSummary(content));
      } else if (mode === StudyMode.QUIZ && quiz.length === 0) {
        setQuiz(await gemini.generateQuiz(content));
      } else if (mode === StudyMode.FLASHCARDS && flashcards.length === 0) {
        setFlashcards(await gemini.generateFlashcards(content));
      } else if (mode === StudyMode.EXPLANATION && !explanation) {
        setExplanation(await gemini.generateExplanation(content));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    if (!quiz.length) return 0;
    let correct = 0;
    quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) correct++;
    });
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
    return (
      <LiveTutor 
        topic={analysis.topic} 
        context={summary || analysis.description} 
        onClose={() => setCurrentMode(StudyMode.READY)} 
        isDark={isDark} 
        lang={lang}
      />
    );
  }

  if (currentMode === StudyMode.READY) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`rounded-2xl p-6 border shadow-sm flex flex-col md:flex-row items-center gap-6 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`w-full md:w-1/3 aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {images.length > 0 ? (
              <img src={images[0].base64} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <Book className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            )}
          </div>
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              {t.topic}
            </div>
            <h2 className="text-2xl font-bold">{analysis.topic}</h2>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{analysis.description}</p>
            <div className="pt-2 text-indigo-500 font-medium text-sm">
              💡 {analysis.suggestion}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.mode}
              onClick={() => fetchContent(item.mode)}
              className={`group p-5 rounded-2xl border transition-all text-left flex items-start gap-4 shadow-sm hover:shadow-md hover:border-indigo-500/50 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <div className={`${item.bg} ${item.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className={`text-sm leading-snug ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{item.desc}</p>
              </div>
              <ChevronRight className={`w-5 h-5 mt-1 shrink-0 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={() => setCurrentMode(StudyMode.READY)}
          className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">
          {menuItems.find(i => i.mode === currentMode)?.title}
        </h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-slate-500 animate-pulse">{t.loading}</p>
        </div>
      ) : (
        <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          {currentMode === StudyMode.SUMMARY && (
            <div className={`p-8 prose max-w-none ${isDark ? 'prose-invert text-slate-300' : 'prose-slate text-slate-700'}`}>
              <div className="space-y-6">
                {summary.split('\n').map((line, i) => {
                   const cleanLine = line.replace(/^#+ /, '');
                   if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mb-4">{cleanLine}</h1>;
                   if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3 border-b border-slate-700/30 pb-2">{cleanLine}</h2>;
                   if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-semibold mt-4 mb-2">{cleanLine}</h3>;
                   if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc">{line.substring(2)}</li>;
                   if (line.trim() === "") return <div key={i} className="h-2"></div>;
                   return <p key={i} className="leading-relaxed mb-4">{line}</p>;
                })}
              </div>
            </div>
          )}

          {currentMode === StudyMode.EXPLANATION && (
            <div className="p-8">
              <div className={`flex items-center gap-3 mb-6 p-4 rounded-xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                <MessageSquare className="w-8 h-8 text-purple-500" />
                <div>
                  <h3 className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>{t.simpleExpTitle}</h3>
                  <p className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{t.simpleExpSub}</p>
                </div>
              </div>
              <div className={`space-y-4 text-lg leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {explanation.split('\n').map((p, i) => p && <p key={i} className="mb-4">{p}</p>)}
              </div>
            </div>
          )}

          {currentMode === StudyMode.QUIZ && (
            <div className="p-6 md:p-8 space-y-10">
              {showQuizResults && (
                <div className={`flex flex-col items-center justify-center p-8 rounded-3xl animate-in zoom-in duration-500 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border-4 ${getScoreFeedback(calculateScore()).color} border-current`}>
                    <span className="text-3xl font-black">{calculateScore().toFixed(1)}</span>
                  </div>
                  <h3 className={`text-2xl font-bold ${getScoreFeedback(calculateScore()).color}`}>
                    {getScoreFeedback(calculateScore()).text}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">{t.scoreFinal}</p>
                </div>
              )}

              {quiz.map((q, qIdx) => (
                <div key={qIdx} className="space-y-4">
                  <h4 className="text-lg font-bold flex gap-3">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-full shrink-0 text-sm ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>{qIdx + 1}</span>
                    {q.question}
                  </h4>
                  <div className="grid grid-cols-1 gap-3 ml-10">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = quizAnswers[qIdx] === oIdx;
                      const isCorrect = q.correctAnswer === oIdx;
                      let btnClass = "text-left p-4 rounded-xl border transition-all ";
                      
                      if (showQuizResults) {
                        if (isCorrect) btnClass += isDark ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-800";
                        else if (isSelected && !isCorrect) btnClass += isDark ? "bg-red-500/20 border-red-500/50 text-red-300" : "bg-red-50 border-red-300 text-red-800";
                        else btnClass += isDark ? "bg-slate-800/50 border-slate-800 text-slate-600 opacity-50" : "bg-slate-50 border-slate-100 text-slate-400";
                      } else {
                        btnClass += isSelected 
                          ? (isDark ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md" : "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm")
                          : (isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50");
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={showQuizResults}
                          onClick={() => setQuizAnswers({...quizAnswers, [qIdx]: oIdx})}
                          className={btnClass}
                        >
                          <div className="flex items-center justify-between">
                            <span>{opt}</span>
                            {showQuizResults && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {showQuizResults && (
                    <div className={`ml-10 p-4 rounded-xl text-sm border-l-4 border-indigo-500 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                      <strong className="text-indigo-500">{t.explanation}</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-center pt-6">
                {!showQuizResults ? (
                  <button
                    disabled={Object.keys(quizAnswers).length < quiz.length}
                    onClick={() => setShowQuizResults(true)}
                    className="bg-indigo-600 text-white px-10 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {t.resultBtn}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizAnswers({});
                      setShowQuizResults(false);
                    }}
                    className="text-indigo-500 font-bold hover:underline flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    {t.retryQuiz}
                  </button>
                )}
              </div>
            </div>
          )}

          {currentMode === StudyMode.FLASHCARDS && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashcards.map((card, i) => (
                  <FlashcardItem key={i} card={card} isDark={isDark} lang={lang} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FlashcardItem: React.FC<{ card: Flashcard; isDark?: boolean; lang: Language }> = ({ card, isDark, lang }) => {
  const [flipped, setFlipped] = useState(false);
  const t = translations[lang];

  return (
    <div 
      onClick={() => setFlipped(!flipped)}
      className="h-64 perspective-1000 cursor-pointer group"
    >
      <div className={`
        relative w-full h-full transition-transform duration-500 transform-style-3d
        ${flipped ? 'rotate-y-180' : ''}
      `}>
        {/* Front */}
        <div className={`absolute inset-0 backface-hidden border-2 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm group-hover:border-indigo-500/50 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <Layers className="w-6 h-6 text-indigo-500 mb-4 opacity-50" />
          <h4 className="text-xl font-bold leading-tight">{card.front}</h4>
          <p className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest font-bold">{t.reveal}</p>
        </div>
        {/* Back */}
        <div className="absolute inset-0 backface-hidden bg-indigo-600 border-2 border-indigo-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg rotate-y-180">
          <p className="text-white text-lg font-medium leading-relaxed">{card.back}</p>
          <p className="text-indigo-200 text-[10px] mt-6 uppercase tracking-widest font-bold">{t.backCard}</p>
        </div>
      </div>
    </div>
  );
};

export default StudyResult;
