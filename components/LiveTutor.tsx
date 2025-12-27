
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Loader2, Volume2, AlertCircle, PlayCircle, Settings, RefreshCw, ShieldAlert, Send, User, Bot, MessageSquareText } from 'lucide-react';
import { Language } from '../types';

interface LiveTutorProps {
  context: string;
  topic: string;
  onClose: () => void;
  isDark?: boolean;
  lang: Language;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const translations = {
  pt: {
    preTitle: "Tutor de Voz IA",
    preDesc: "Inicie uma aula por voz. Se o microfone falhar, poderemos usar texto.",
    startBtn: "Conectar Voz",
    connecting: "Sincronizando...",
    online: "Tutor Conectado",
    ready: "Pode falar, estou ouvindo!",
    close: "Encerrar",
    sys: "Você é um tutor especialista didático. Responda de forma curta e direta.",
    errorMic: "Não foi possível acessar o microfone neste dispositivo.",
    switchToText: "Estudar por Texto",
    textModeTitle: "Chat com Tutor",
    textModePlaceholder: "Tire sua dúvida sobre este tema...",
    sending: "IA pensando...",
    micInstruction: "O sistema bloqueou o acesso ao áudio. Você pode tentar reiniciar o app ou continuar usando apenas texto abaixo.",
    resetBtn: "Resetar App",
    errorAuth: "Erro de Autenticação: Chave de API inválida."
  },
  en: {
    preTitle: "AI Voice Tutor",
    preDesc: "Start a voice lesson. If mic fails, we can use text.",
    startBtn: "Connect Voice",
    connecting: "Syncing...",
    online: "Tutor Online",
    ready: "Go ahead, I'm listening!",
    close: "Finish",
    sys: "You are an expert tutor. Give concise and direct answers.",
    errorMic: "Could not access the microphone on this device.",
    switchToText: "Study via Text",
    textModeTitle: "Tutor Chat",
    textModePlaceholder: "Ask something about this topic...",
    sending: "AI thinking...",
    micInstruction: "System blocked audio access. You can try restarting the app or continue using text below.",
    resetBtn: "Reset App",
    errorAuth: "Authentication Error: Invalid API Key."
  }
};

export const LiveTutor: React.FC<LiveTutorProps> = ({ context, topic, onClose, isDark, lang }) => {
  const [sessionState, setSessionState] = useState<'pre' | 'connecting' | 'active' | 'text' | 'error'>('pre');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // States para o modo Texto
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatInstanceRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const t = translations[lang];

  const getApiKey = () => process.env.API_KEY || (window as any).GEMINI_API_KEY;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hardReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const decode = (base64: string) => {
    try { return Uint8Array.from(atob(base64), c => c.charCodeAt(0)); } catch(e) { return new Uint8Array(0); }
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const startTextMode = () => {
    const apiKey = getApiKey();
    if (!apiKey || apiKey === "") {
      setErrorMsg(t.errorAuth);
      setSessionState('error');
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    chatInstanceRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `${t.sys} O tema da aula é: ${topic}. Contexto: ${context}`
      }
    });

    setMessages([{ role: 'model', text: `Olá! Como o microfone está indisponível, vamos continuar por aqui. O que você gostaria de saber sobre "${topic}"?` }]);
    setSessionState('text');
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || !chatInstanceRef.current) return;

    const userText = inputText.trim();
    setInputText("");
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsSending(true);

    try {
      const result = await chatInstanceRef.current.sendMessage({ message: userText });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "..." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Erro ao conectar com a IA. Verifique sua internet." }]);
    } finally {
      setIsSending(false);
    }
  };

  const startSession = async () => {
    const apiKey = getApiKey();
    
    if (!apiKey || apiKey === "") {
      setErrorMsg(t.errorAuth);
      setSessionState('error');
      return;
    }

    setSessionState('connecting');
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioCtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const ai = new GoogleGenAI({ apiKey });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: `${t.sys} Tema: ${topic}. Contexto: ${context}`
        },
        callbacks: {
          onopen: () => {
            setSessionState('active');
            const source = audioCtx.createMediaStreamSource(stream);
            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted || !sessionPromiseRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: `audio/pcm;rate=${audioCtx.sampleRate}`
              };
              sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (message) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const data = decode(audioData);
              const dataInt16 = new Int16Array(data.buffer);
              const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
              buffer.getChannelData(0).set(Array.from(dataInt16).map(v => v / 32768.0));

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              const source = audioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
          },
          onclose: () => setSessionState('error'),
          onerror: (e) => {
            console.error("Gemini Connection Error:", e);
            setSessionState('error');
          }
        }
      });

    } catch (err: any) {
      console.error("Mic Error:", err);
      setErrorMsg(t.errorMic);
      setSessionState('error');
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-3xl ${isDark ? 'bg-slate-950/98' : 'bg-white/98'}`}>
      <div className="max-w-md w-full h-full flex flex-col justify-center gap-8 animate-scale-in">
        
        {sessionState === 'pre' && (
          <div className="space-y-8 py-10 px-6 rounded-[3rem] border border-indigo-500/20 bg-indigo-500/5 shadow-2xl text-center">
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
               <Mic className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black">{t.preTitle}</h2>
              <h3 className="text-xl font-bold text-indigo-500">{topic}</h3>
              <p className="text-slate-500 font-medium text-sm">{t.preDesc}</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={startSession}
                className="w-full py-5 bg-indigo-600 text-white rounded-full font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl active:scale-95 transition-all"
              >
                <PlayCircle className="w-7 h-7" />
                {t.startBtn}
              </button>
              <button 
                onClick={startTextMode}
                className="w-full py-4 bg-slate-800 text-slate-300 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-slate-700 transition-all"
              >
                <MessageSquareText className="w-5 h-5" />
                {t.switchToText}
              </button>
            </div>
            <button onClick={onClose} className="text-slate-500 font-bold block mx-auto">Sair</button>
          </div>
        )}

        {sessionState === 'connecting' && (
          <div className="flex flex-col items-center gap-6 py-20 text-center">
            <Loader2 className="w-20 h-20 text-indigo-600 animate-spin" />
            <h2 className="text-2xl font-black animate-pulse">{t.connecting}</h2>
          </div>
        )}

        {sessionState === 'active' && (
          <div className="space-y-10 text-center">
            <div className="w-48 h-48 rounded-full flex items-center justify-center shadow-2xl mx-auto border-8 border-indigo-500/30 bg-indigo-600 animate-pulse-soft">
              <Volume2 className="w-20 h-20 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black">{t.online}</h2>
              <p className="text-xl font-bold text-indigo-400">{t.ready}</p>
            </div>
            <div className="flex justify-center gap-6">
              <button onClick={() => setIsMuted(!isMuted)} className={`p-7 rounded-full shadow-2xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
                {isMuted ? <MicOff size={35} /> : <Mic size={35} />}
              </button>
              <button onClick={onClose} className="flex items-center gap-3 px-10 py-7 bg-red-600 text-white rounded-full font-black text-xl shadow-2xl">
                <PhoneOff size={30} />
                {t.close}
              </button>
            </div>
          </div>
        )}

        {sessionState === 'text' && (
          <div className="flex flex-col w-full h-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
               <div className="flex items-center gap-3">
                 <Bot className="text-indigo-500" />
                 <h2 className="font-black text-white">{t.textModeTitle}</h2>
               </div>
               <button onClick={onClose} className="text-slate-500 font-bold">Fechar</button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
               {messages.map((m, i) => (
                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl flex gap-3 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                      {m.role === 'model' && <Bot size={18} className="shrink-0 mt-1 text-indigo-400" />}
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                    </div>
                 </div>
               ))}
               {isSending && (
                 <div className="flex justify-start animate-pulse">
                   <div className="bg-slate-800 p-4 rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-widest">{t.sending}</div>
                 </div>
               )}
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-slate-800/30 flex gap-2">
               <input 
                 type="text"
                 value={inputText}
                 onChange={e => setInputText(e.target.value)}
                 placeholder={t.textModePlaceholder}
                 className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-indigo-500 transition-all"
               />
               <button type="submit" className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all">
                 <Send size={20} />
               </button>
            </form>
          </div>
        )}

        {sessionState === 'error' && (
          <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[3rem] space-y-6 text-center">
            <ShieldAlert className="w-20 h-20 text-red-500 mx-auto animate-bounce" />
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-red-500">Erro de Conexão</h2>
              <p className="text-red-400 font-bold text-sm">{errorMsg}</p>
              <p className="text-xs text-slate-500 italic mt-4">{t.micInstruction}</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button onClick={startTextMode} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                <MessageSquareText />
                {t.switchToText}
              </button>
              <div className="flex gap-2">
                <button onClick={hardReset} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                  <RefreshCw size={14} /> {t.resetBtn}
                </button>
                <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-sm">Voltar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
