
import React, { useState } from 'react';
import { X, Github, Chrome, Loader2, ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, UserPlus, Sparkles, Cloud } from 'lucide-react';
import { Language, User, StoredAccount } from '../types';
import * as cloud from '../services/cloudStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  isDark: boolean;
  lang: Language;
}

const BANNED_EMAIL = "samuelribeiropassos@gmail.com";

const translations = {
  pt: {
    title: "Acesse sua Conta Global",
    subtitle: "Seus dados agora são salvos na nuvem e acessíveis em qualquer lugar.",
    loginTab: "Entrar",
    signupTab: "Criar Conta",
    emailPlaceholder: "Seu e-mail",
    passwordPlaceholder: "Sua senha",
    namePlaceholder: "Seu nome completo",
    continue: "Acessar Plataforma",
    create: "Criar minha conta",
    loading: "Sincronizando...",
    privacy: "Sua conta é global e segura.",
    errorEmailNotFound: "E-mail não cadastrado na nuvem.",
    errorWrongPassword: "Senha incorreta.",
    errorSignup: "Este e-mail já está em uso. Tente fazer login.",
    errorEmpty: "Preencha todos os campos corretamente.",
    errorBanned: "Este e-mail foi banido da plataforma por violar os termos."
  },
  en: {
    title: "Access Global Account",
    subtitle: "Your data is now saved in the cloud and accessible anywhere.",
    loginTab: "Login",
    signupTab: "Sign Up",
    emailPlaceholder: "Your email",
    passwordPlaceholder: "Your password",
    namePlaceholder: "Your full name",
    continue: "Access Platform",
    create: "Create my account",
    loading: "Syncing...",
    privacy: "Your account is global and secure.",
    errorEmailNotFound: "Email not registered in the cloud.",
    errorWrongPassword: "Incorrect password.",
    errorSignup: "This email is already in use. Try logging in.",
    errorEmpty: "Please fill in all fields correctly.",
    errorBanned: "This email has been banned from the platform for violating terms."
  }
};

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, isDark, lang }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  const t = translations[lang];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanPassword || (view === 'signup' && !cleanName)) {
      setError(t.errorEmpty);
      return;
    }

    // Ban Check
    if (cleanEmail === BANNED_EMAIL) {
      setError(t.errorBanned);
      return;
    }

    setLoading(true);

    try {
      const accounts = await cloud.getGlobalAccounts();

      if (view === 'login') {
        const foundUser = accounts.find(u => u.email.toLowerCase().trim() === cleanEmail);
        if (!foundUser || foundUser.password !== cleanPassword) {
          setError(!foundUser ? t.errorEmailNotFound : t.errorWrongPassword);
          setLoading(false);
          return;
        }

        onLogin({
          name: foundUser.name,
          email: foundUser.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundUser.name}`,
          provider: 'email',
          verified: true,
          points: foundUser.points || 50,
          preferences: foundUser.preferences
        });
      } else {
        // Validação estrita de e-mail existente antes de criar
        const emailExists = accounts.some(u => u.email.toLowerCase().trim() === cleanEmail);
        
        if (emailExists) {
          setError(t.errorSignup);
          setLoading(false);
          return;
        }

        const newAccount: StoredAccount = {
          email: cleanEmail,
          password: cleanPassword,
          name: cleanName,
          points: 50
        };
        
        await cloud.saveGlobalAccount(newAccount);

        onLogin({
          name: cleanName,
          email: cleanEmail,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanName}`,
          provider: 'email',
          verified: true,
          points: 50
        });
      }
      onClose();
    } catch (e) {
      console.error(e);
      setError("Erro de conexão com a nuvem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-sm overflow-hidden rounded-[2.5rem] shadow-2xl transition-colors ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className="p-8">
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-500/10"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-6 text-center">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h3>
            <p className="text-sm text-slate-500">{t.subtitle}</p>

            <div className={`flex p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button onClick={() => { setView('login'); setError(null); }} className={`flex-1 py-2 text-sm font-bold rounded-lg ${view === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'}`}>{t.loginTab}</button>
              <button onClick={() => { setView('signup'); setError(null); }} className={`flex-1 py-2 text-sm font-bold rounded-lg ${view === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500'}`}>{t.signupTab}</button>
            </div>

            <form onSubmit={handleAuth} className="space-y-3 text-left">
              {view === 'signup' && (
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={t.passwordPlaceholder} className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 outline-none focus:border-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              {error && (
                <div className="text-red-500 text-xs font-bold px-2 flex items-start gap-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{view === 'login' ? t.continue : t.create}<ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 pt-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{t.privacy}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
