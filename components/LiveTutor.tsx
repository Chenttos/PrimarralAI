
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Loader2, Volume2 } from 'lucide-react';
import { Language } from '../types';

interface LiveTutorProps {
  context: string;
  topic: string;
  onClose: () => void;
  isDark?: boolean;
  lang: Language;
}

const translations = {
  pt: {
    connecting: "Conectando ao Tutor...",
    online: "Tutor Online",
    ready: "A IA está pronta para explicar. Você pode falar agora.",
    preparing: "Preparando ambiente de áudio...",
    close: "Encerrar Aula",
    sys: "Você é um tutor especialista. Responda em Português do Brasil."
  },
  en: {
    connecting: "Connecting to Tutor...",
    online: "Tutor Online",
    ready: "AI is ready to explain. You can speak now.",
    preparing: "Preparing audio environment...",
    close: "End Lesson",
    sys: "You are an expert tutor. Respond in English."
  }
};

export const LiveTutor: React.FC<LiveTutorProps> = ({ context, topic, onClose, isDark, lang }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const t = translations[lang];

  // Fix: Implement manual base64 decoding following guidelines
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Fix: Implement manual base64 encoding following guidelines
  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Fix: Raw PCM decoding logic following example (do not use decodeAudioData for raw PCM)
  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  useEffect(() => {
    // Fix: Use process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const startSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputCtx;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            systemInstruction: `${t.sys} O tema da aula é: ${topic}. 
            Contexto do material de estudo: ${context}. 
            Sua tarefa é explicar este material de forma clara e interativa. 
            O usuário pode falar com você para tirar dúvidas. Seja conciso e encorajador.`
          },
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              setIsActive(true);
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                if (isMuted) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000'
                };
                // Fix: Solely rely on sessionPromise resolve to send realtime input
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message) => {
              // Fix: Correct extraction of audio data
              const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioBase64) {
                // Fix: Handle playback queue using nextStartTimeRef
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const buffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
              if (message.serverContent?.interrupted) {
                // Fix: Stop all currently playing audio chunks on interruption
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                  sourcesRef.current.delete(s);
                });
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => setIsActive(false),
            onerror: (e) => console.error("Live API Error:", e)
          }
        });

        await sessionPromise;
      } catch (err) {
        console.error("Failed to start Live session", err);
        onClose();
      }
    };

    startSession();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [topic, context, lang, onClose]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-xl ${isDark ? 'bg-slate-950/90' : 'bg-white/90'}`}>
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative flex justify-center">
          <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 animate-pulse bg-indigo-500`}></div>
          <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl relative z-10 ${isActive ? 'bg-indigo-600 animate-bounce' : 'bg-slate-300'}`}>
            {isConnecting ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : (
              <Volume2 className="w-12 h-12 text-white" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isConnecting ? t.connecting : t.online}
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isActive ? t.ready : t.preparing}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-all shadow-lg ${isMuted ? 'bg-red-500 text-white' : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600')}`}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-full font-bold shadow-xl hover:bg-black transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
