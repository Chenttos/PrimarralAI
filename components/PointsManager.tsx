
import React, { useState } from 'react';
import { X, Sparkles, Gift, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface PointsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
  onRedeem: (code: string) => Promise<boolean>;
  isDark: boolean;
  lang: Language;
}

const translations = {
  pt: {
    title: "Minha Carteira IP",
    subtitle: "Pontos Intelectuais ganhos estudando.",
    current: "Saldo Atual",
    redeemTitle: "Resgatar Código",
    redeemDesc: "Insira um código promocional para ganhar IP.",
    placeholder: "EX: PRIMARRAL2025",
    btn: "Resgatar",
    success: "Código resgatado com sucesso!",
    error: "Código inválido ou já utilizado.",
    earnMore: "Como ganhar mais?",
    earnTip: "Cada estudo concluído gera +1 IP."
  },
  en: {
    title: "My IP Wallet",
    subtitle: "Intellectual Points earned while studying.",
    current: "Current Balance",
    redeemTitle: "Redeem Code",
    redeemDesc: "Enter a promo code to earn IP.",
    placeholder: "EX: PRIMARRAL2025",
    btn: "Redeem",
    success: "Code redeemed successfully!",
    error: "Invalid or already used code.",
    earnMore: "How to earn more?",
    earnTip: "Each completed study earns +1 IP."
  }
};

const PointsManager: React.FC<PointsManagerProps> = ({ isOpen, onClose, points, onRedeem, isDark, lang }) => {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  if (!isOpen) return null;
  const t = translations[lang];

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus('loading');
    const ok = await onRedeem(code.trim().toUpperCase());
    if (ok) {
      setStatus('success');
      setCode("");
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-sm overflow-hidden rounded-[2rem] shadow-2xl transition-colors ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-lg">{t.title}</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-500/10"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-3xl text-center relative overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-indigo-50'}`}>
              <Sparkles className="absolute -top-2 -left-2 w-12 h-12 text-indigo-500/10" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{t.current}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-indigo-600">{points}</span>
                <span className="text-lg font-bold text-indigo-400">IP</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm">{t.redeemTitle}</h4>
                <p className="text-xs text-slate-500">{t.redeemDesc}</p>
              </div>
              <form onSubmit={handleRedeem} className="flex gap-2">
                <input 
                  type="text" 
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder={t.placeholder}
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 outline-none focus:border-indigo-500 text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              
              {status === 'success' && (
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold animate-in slide-in-from-top-1">
                  <CheckCircle2 className="w-4 h-4" /> {t.success}
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4" /> {t.error}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-2xl border-2 border-dashed ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
              <h4 className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">{t.earnMore}</h4>
              <p className="text-xs text-slate-400">{t.earnTip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsManager;
