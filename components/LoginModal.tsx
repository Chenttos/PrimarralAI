
import React, { useState } from 'react';
import { X, Loader2, ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, UserPlus, Cloud } from 'lucide-react';
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
    errorBanned: "Este e-mail foi banido da plataforma por violar os termos de uso.",
    googleBtn: "Continuar com Google",
    or: "ou use seu e-mail"
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
    errorBanned: "This email has been banned from the platform for violating terms of use.",
    googleBtn: "Continue with Google",
    or: "or use your email"
  }
};

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.13-.45-4.63H24v9.3h12.98c-.58 2.85-2.18 5.25-4.59 6.81l7.8 6.05c4.56-4.2 7.19-10.38 7.19-17.53z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.8-6.05c-2.19 1.47-4.99 2.36-8.09 2.36-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, isDark, lang }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  const t = translations[lang];

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    
    // Simulação de Login Google
    // Em produção, aqui chamaria o google.accounts.id.prompt() ou similar
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockGoogleUser = {
        email: "estudante.demo@gmail.com",
        name: "Estudante Google Demo",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleDemo"
      };

      const accounts = await cloud.getGlobalAccounts();
      const existing = accounts.find(a => a.email.toLowerCase() === mockGoogleUser.email.toLowerCase());

      if (!existing) {
        // Cria conta automática para novos usuários via Google
        const newAccount: StoredAccount = {
          email: mockGoogleUser.email,
          password: "oauth_google_protected",
          name: mockGoogleUser.name,
          points: 50
        };
        await cloud.saveGlobalAccount(newAccount);
      }

      onLogin({
        name: existing?.name || mockGoogleUser.name,
        email: mockGoogleUser.email,
        avatar: mockGoogleUser.avatar,
        provider: 'google',
        verified: true,
        points: existing?.points || 50,
        preferences: existing?.preferences
      });
      
      onClose();
    } catch (e) {
      setError("Falha na autenticação com Google.");
    } finally {
      setLoading(false);
    }
  };

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

    if (cleanEmail === BANNED_EMAIL.toLowerCase()) {
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
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl" onClick={onClose} />
      <div className={`relative w-full max-w-sm overflow-hidden rounded-[2.5rem] shadow-2xl animate-scale-in transition-colors ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className="p-8">
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/30 animate-float">
              <Cloud className="w-10 h-10 text-white" />
            </div>
            <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h3>
            
            {/* Google Login Button */}
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl border-2 font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><GoogleIcon /> {t.googleBtn}</>}
            </button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-800/20"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.or}</span>
              <div className="flex-1 h-px bg-slate-800/20"></div>
            </div>

            <div className={`flex p-1.5 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button onClick={() => { setView('login'); setError(null); }} className={`flex-1 py-2 text-sm font-black rounded-xl transition-all ${view === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}>{t.loginTab}</button>
              <button onClick={() => { setView('signup'); setError(null); }} className={`flex-1 py-2 text-sm font-black rounded-xl transition-all ${view === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}>{t.signupTab}</button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4 text-left">
              {view === 'signup' && (
                <div className="group relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t.namePlaceholder} className={`w-full pl-11 pr-4 py-4 rounded-2xl border-2 outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                </div>
              )}
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className={`w-full pl-11 pr-4 py-4 rounded-2xl border-2 outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={t.passwordPlaceholder} className={`w-full pl-11 pr-4 py-4 rounded-2xl border-2 outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 hover:shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{view === 'login' ? t.continue : t.create}<ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-800/20">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">{t.privacy}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
