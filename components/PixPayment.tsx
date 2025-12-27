
import React, { useState, useEffect } from 'react';
import { QrCode, Copy, CheckCircle2, ArrowLeft, Loader2, ShieldCheck, Upload, Phone, AlertTriangle, Sparkles } from 'lucide-react';
import { generatePixPayload } from '../services/pixService';
import { verifyPixReceipt } from '../services/geminiService';

interface PixPaymentProps {
  amount: number;
  points: number;
  onSuccess: (points: number) => void;
  onBack: () => void;
  isDark: boolean;
}

const PixPayment: React.FC<PixPaymentProps> = ({ amount, points, onSuccess, onBack, isDark }) => {
  const [pixCode, setPixCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const RAW_PHONE = "+5562982166200";

  useEffect(() => {
    setPixCode(generatePixPayload(amount));
  }, [amount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceipt(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRealVerify = async () => {
    if (!receipt) {
      setError("Por favor, envie o comprovante primeiro.");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const result = await verifyPixReceipt(receipt, amount);
      if (result.verified) {
        onSuccess(points);
      } else {
        setError(result.reason || "Não foi possível validar este comprovante automaticamente.");
      }
    } catch (err) {
      setError("Erro no sistema de IA. Verifique sua conexão.");
    } finally {
      setVerifying(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-black">Pagamento Seguro</h3>
      </div>

      <div className={`p-6 rounded-[2.5rem] border space-y-6 shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {!receipt ? (
          <>
            <div className="text-center space-y-1">
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Total a Pagar</p>
              <p className="text-4xl font-black text-indigo-500">R$ {amount.toFixed(2)}</p>
            </div>

            <div className="relative mx-auto w-56 h-56 bg-white p-3 rounded-3xl shadow-lg">
              <img src={qrCodeUrl} alt="PIX QR Code" className="w-full h-full" />
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Escolha como pagar:</p>
              
              {/* Opção 1: Copia e Cola */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(pixCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className={`w-full py-4 px-5 rounded-2xl border-2 flex items-center justify-between transition-all ${copiedCode ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-slate-800 hover:border-indigo-500 bg-slate-800/20'}`}
              >
                <div className="flex items-center gap-3">
                  <Copy className="w-4 h-4" />
                  <span className="text-xs font-bold">PIX Copia e Cola</span>
                </div>
                {copiedCode && <CheckCircle2 className="w-4 h-4" />}
              </button>

              {/* Opção 2: Chave Direta (O "Outro Jeito") */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(RAW_PHONE);
                  setCopiedPhone(true);
                  setTimeout(() => setCopiedPhone(false), 2000);
                }}
                className={`w-full py-4 px-5 rounded-2xl border-2 flex items-center justify-between transition-all ${copiedPhone ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-indigo-600 bg-indigo-600/10 text-indigo-500'}`}
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4" />
                  <div className="text-left">
                    <span className="text-xs font-black block">Usar Chave (Telefone)</span>
                    <span className="text-[10px] opacity-70">{RAW_PHONE}</span>
                  </div>
                </div>
                {copiedPhone && <CheckCircle2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800/50">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 text-center">Após pagar, anexe o comprovante:</p>
              <label className="w-full flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:bg-indigo-500/5 transition-all">
                <Upload className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-xs font-black">Selecionar Foto/Print</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="relative mx-auto w-40 h-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-indigo-500">
              <img src={receipt} alt="Comprovante" className="w-full h-full object-cover" />
              {verifying && (
                <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1">
               <h4 className="font-black text-lg">Validar Pagamento?</h4>
               <p className="text-xs text-slate-500">Nossa IA verificará os dados do print agora.</p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-500 text-left text-xs font-bold">
                <AlertTriangle className="shrink-0 w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleRealVerify}
                disabled={verifying}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {verifying ? "Analisando..." : "Confirmar e Ganhar IPs"}
              </button>
              <button onClick={() => setReceipt(null)} disabled={verifying} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Trocar Imagem</button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 opacity-40">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <p className="text-[8px] font-black uppercase tracking-widest">Verificação Segura via Gemini AI</p>
        </div>
      </div>
    </div>
  );
};

export default PixPayment;
