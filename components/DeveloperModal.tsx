
import React from 'react';
import { X, User, Mail, Calendar } from 'lucide-react';
import { Language } from '../types';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  lang: Language;
}

const translations = {
  pt: {
    title: "Desenvolvedor",
    name: "Nome Completo",
    email: "E-mail",
    date: "Data de Criação",
    quote: "A tecnologia a serviço do conhecimento."
  },
  en: {
    title: "Developer",
    name: "Full Name",
    email: "Email",
    date: "Creation Date",
    quote: "Technology at the service of knowledge."
  }
};

const DeveloperModal: React.FC<DeveloperModalProps> = ({ isOpen, onClose, isDark, lang }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 transition-colors ${isDark ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-slate-900'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              {t.title}
            </h3>
            <button 
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <User className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.name}</p>
                <p className="font-semibold text-lg">Samuel Ribeiro Passos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Mail className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.email}</p>
                <a href="mailto:Samuelribeiropassos@gmail.com" className="font-semibold hover:text-indigo-500 transition-colors">
                  Samuelribeiropassos@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <Calendar className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.date}</p>
                <p className="font-semibold">25 de dezembro de 2025</p>
              </div>
            </div>
          </div>

          <div className={`mt-10 pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <p className={`text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              "{t.quote}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperModal;
