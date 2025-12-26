
import React, { useState, useEffect } from 'react';
import { X, Github, Chrome, Loader2, ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, UserPlus } from 'lucide-react';
import { Language, User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  isDark: boolean;
  lang: Language;
}

interface StoredAccount {
  email: string;
  password: string;
  name: string;
}

// Contas padrão do sistema
const DEFAULT_ACCOUNTS: StoredAccount[] = [
  { email: 'admin@primarral.ai', password: '123', name: 'Admin Primarral' },
  { email: 'estudante@email.com', password: 'estudar123', name: 'João Silva' }
];

const translations = {
  pt: {
    title: "Acesse sua Conta",
    subtitle: "Faça login para começar seus estudos com IA.",
    loginTab: "Entrar",
    signupTab: "Criar Conta",
    google: "Google",
    github: "GitHub",
    emailPlaceholder: "Seu e-mail",
    passwordPlaceholder: "Sua senha",
    namePlaceholder: "Seu nome completo",
    continue: "Acessar Plataforma",
    create: "Criar minha conta",
    loading: "Aguarde...",
    or: "ou use",
    privacy: "Ao entrar, você concorda com nossos termos de uso.",
    errorEmailNotFound: "E-mail não encontrado. Verifique ou crie uma conta.",
    errorWrongPassword: "Senha incorreta. Tente novamente.",
    errorSignup: "Este e-mail já está cadastrado.",
    errorNameEmpty: "Por favor, informe seu nome.",
    hint: "Dica: Use admin@primarral.ai / 123",
    successSignup: "Conta criada com sucesso! Fazendo login..."
  },
  en: {
    title: "Access your Account",
    subtitle: "Log in to start your AI studies.",
    loginTab: "Login",
    signupTab: "Sign Up",
    google: "Google",
    github: "GitHub",
    emailPlaceholder: "Your email",
    passwordPlaceholder: "Your password",
    namePlaceholder: "Your full name",
    continue: "Access Platform",
    create: "Create my account",
    loading: "Please wait...",
    or: "or use",
    privacy: "By entering, you agree to our terms of use.",
    errorEmailNotFound: "Email not found. Check or create an account.",
    errorWrongPassword: "Incorrect password. Try again.",
    errorSignup: "This email is already registered.",
    errorNameEmpty: "Please enter your name.",
    hint: "Hint: Use admin@primarral.ai / 123",
    successSignup: "Account created! Logging in..."
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

  // Helper para buscar todas as contas (Padrão + LocalStorage)
  const getAllAccounts = (): StoredAccount[] => {
    const localData = localStorage.getItem('primarral_db_accounts');
    const localAccounts: StoredAccount[] = localData ? JSON.parse(localData) : [];
    return [...DEFAULT_ACCOUNTS, ...localAccounts];
  };

  // Helper para salvar nova conta
  const saveLocalAccount = (newAcc: StoredAccount) => {
    const localData = localStorage.getItem('primarral_db_accounts');
    const localAccounts: StoredAccount[] = localData ? JSON.parse(localData) : [];
    localAccounts.push(newAcc);
    localStorage.setItem('primarral_db_accounts', JSON.stringify(localAccounts));
  };

  const handleSocialLogin = (provider: 'google' | 'github') => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const mockUser: User = {
        name: provider === 'google' ? "Usuário Google" : "Dev GitHub",
        email: provider === 'google' ? "user@gmail.com" : "dev@github.com",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider === 'google' ? 'Felix' : 'Aneka'}`,
        provider,
        verified: true
      };
      onLogin(mockUser);
      setLoading(false);
      onClose();
    }, 1200);
  };

  const handleEmailStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const accounts = getAllAccounts();

    setTimeout(() => {
      if (view === 'login') {
        const foundUser = accounts.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!foundUser) {
          setError(t.errorEmailNotFound);
          setLoading(false);
          return;
        }

        if (foundUser.password !== password) {
          setError(t.errorWrongPassword);
          setLoading(false);
          return;
        }

        const mockUser: User = {
          name: foundUser.name,
          email: foundUser.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${foundUser.name}`,
          provider: 'email',
          verified: true
        };
        onLogin(mockUser);
      } else {
        // Lógica de Registro (Signup)
        if (!name.trim()) {
          setError(t.errorNameEmpty);
          setLoading(false);
          return;
        }

        const alreadyExists = accounts.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (alreadyExists) {
          setError(t.errorSignup);
          setLoading(false);
          return;
        }

        // Salva "na nuvem" (localStorage)
        const newAccount: StoredAccount = {
          email: email.toLowerCase(),
          password: password,
          name: name
        };
        saveLocalAccount(newAccount);

        const mockUser: User = {
          name: name,
          email: email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          provider: 'email',
          verified: true
        };
        onLogin(mockUser);
      }
      
      setLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      
      <div className={`relative w-full max-w-sm overflow-hidden rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 transition-colors ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className="p-8">
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 animate-in fade-in">
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.title}</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
            </div>

            <div className={`flex p-1 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button 
                onClick={() => { setView('login'); setError(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === 'login' ? (isDark ? 'bg-slate-700 text-white shadow' : 'bg-white text-indigo-600 shadow') : 'text-slate-500'}`}
              >
                {t.loginTab}
              </button>
              <button 
                onClick={() => { setView('signup'); setError(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === 'signup' ? (isDark ? 'bg-slate-700 text-white shadow' : 'bg-white text-indigo-600 shadow') : 'text-slate-500'}`}
              >
                {t.signupTab}
              </button>
            </div>

            <form onSubmit={handleEmailStep} className="space-y-3">
              {view === 'signup' && (
                <div className="relative animate-in slide-in-from-top-2">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-bold px-2 py-1 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {view === 'login' ? t.continue : t.create}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {view === 'login' && (
              <p className={`text-[10px] text-center font-bold ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                {t.hint}
              </p>
            )}

            <div className="relative">
              <div className={`absolute inset-0 flex items-center ${isDark ? 'opacity-20' : 'opacity-10'}`}><div className="w-full border-t border-current"></div></div>
              <div className="relative flex justify-center text-xs uppercase font-bold text-slate-500"><span className={`px-4 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>{t.or}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border font-bold transition-all ${isDark ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
              >
                <Chrome className="w-4 h-4" />
                {t.google}
              </button>
              <button
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border font-bold transition-all ${isDark ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
              >
                <Github className="w-4 h-4" />
                {t.github}
              </button>
            </div>
            
            <p className={`text-[10px] text-center uppercase tracking-widest font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {t.privacy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
