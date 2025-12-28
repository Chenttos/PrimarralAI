
import React, { useState } from 'react';
import { X, Sparkles, Gift, Send, CheckCircle2, AlertCircle, ShoppingBag, Zap, ArrowRight, Heart } from 'lucide-react';
import { Language } from '../types';
import PixPayment from './PixPayment';

interface PointsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
  onRedeem: (code: string) => Promise<boolean>;
  onPurchaseSuccess: (addedPoints: number) => void;
  isDark: boolean;
  lang: Language;
  userEmail?: string;
}

const ADMIN_EMAILS = ["samuelribeiropassos@icloud.com", "cassiuspereirahector@gmail.com"];

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
    earnTip: "Cada estudo concluído gera +1 IP.",
    shopTitle: "Loja de IPs",
    shopDesc: "Turbine seus estudos comprando pacotes."
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
    earnTip: "Each completed study earns +1 IP.",
    shopTitle: "IP Shop",
    shopDesc: "Boost your studies by buying packs."
  }
};

const PointsManager: React.FC<PointsManagerProps> = ({ isOpen, onClose, points, onRedeem, onPurchaseSuccess, isDark, lang, userEmail }) => {
  const [view, setView] = useState<'wallet' | 'shop' | 'pix'>('wallet');
  const [selectedPack, setSelectedPack] = useState<{amount: number, points: number} | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  if (!isOpen) return null;
  const t = translations[lang];

  const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase().trim());

  const packs = [
    { points: 5, price: 0.1, label: "Econômico", popular: false },
    { points: 50, price: 5, label: "Iniciante", popular: false },
    { points: 150, price: 10, label: "Estudante", popular: true },
    { points: 500, price: 25, label: "Master", popular: false },
  ];

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

  const startPurchase = (price: number, p: number) => {
    setSelectedPack({ amount: price, points: p });
    setView('pix');
  };

  const handlePurchaseComplete = (p: number) => {
    onPurchaseSuccess(p);
    setView('wallet');
    alert(`Sucesso! ${p} IPs foram adicionados à sua conta.`);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-sm overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-500 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              <h3 className="font-black text-lg uppercase tracking-tight">
                {view === 'wallet' ? t.title : view === 'shop' ? t.shopTitle : 'Checkout'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-500/10"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-6">
            {view === 'wallet' && (
              <>
                <div className={`p-8 rounded-[2rem] text-center relative overflow-hidden shadow-inner ${isDark ? 'bg-slate-800/50' : 'bg-indigo-50'}`}>
                  <Sparkles className="absolute -top-2 -left-2 w-16 h-16 text-indigo-500/10" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t.current}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-5xl font-black text-indigo-600">{isAdmin ? "∞" : points}</span>
                    <span className="text-xl font-bold text-indigo-400">IP</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setView('shop')} className="col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl transition-all active:scale-95">
                     <ShoppingBag className="w-5 h-5" />
                     Ir para a Loja
                   </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">{t.redeemTitle}</h4>
                  </div>
                  <form onSubmit={handleRedeem} className="flex gap-2">
                    <input 
                      type="text" 
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder={t.placeholder}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500 text-sm font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                    <button 
                      type="submit"
                      disabled={status === 'loading'}
                      className="bg-slate-800 text-white px-4 rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  {status === 'success' && <div className="text-emerald-500 text-[10px] font-bold flex items-center gap-1 animate-bounce"><CheckCircle2 size={12}/> {t.success}</div>}
                  {status === 'error' && <div className="text-red-500 text-[10px] font-bold flex items-center gap-1"><AlertCircle size={12}/> {t.error}</div>}
                </div>
              </>
            )}

            {view === 'shop' && (
              <div className="space-y-4 animate-slide-up max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {packs.map((pack) => (
                  <button 
                    key={pack.points} 
                    onClick={() => startPurchase(pack.price, pack.points)}
                    className={`w-full p-5 rounded-3xl border-2 text-left flex items-center justify-between transition-all group hover:scale-[1.02] ${pack.popular ? 'border-indigo-500 bg-indigo-500/5 shadow-xl' : isDark ? 'border-slate-800' : 'border-slate-100'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${pack.popular ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 text-slate-500 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                        <Zap size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-lg">{pack.points} IP</h4>
                          {pack.popular && <span className="bg-indigo-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Melhor Valor</span>}
                        </div>
                        <p className="text-xs text-slate-500 font-bold">{pack.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-indigo-500">
                        R$ {pack.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <ArrowRight className="w-4 h-4 text-slate-700 ml-auto mt-1" />
                    </div>
                  </button>
                ))}
                <button onClick={() => setView('wallet')} className="w-full py-2 text-slate-500 font-bold text-xs mt-4">Voltar para Carteira</button>
              </div>
            )}

            {view === 'pix' && selectedPack && (
              <PixPayment 
                amount={selectedPack.amount} 
                points={selectedPack.points} 
                onSuccess={handlePurchaseComplete} 
                onBack={() => setView('shop')} 
                isDark={isDark} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsManager;
