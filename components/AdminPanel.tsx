
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Trash2, 
  ArrowLeft, 
  Search, 
  BarChart3, 
  Database,
  UserPlus,
  Mail,
  Zap,
  MoreVertical,
  Plus,
  Minus,
  Loader2
} from 'lucide-react';
import { Language, StoredAccount } from '../types';
import * as cloud from '../services/cloudStore';

interface AdminPanelProps {
  onBack: () => void;
  isDark: boolean;
  lang: Language;
}

const translations = {
  pt: {
    title: "Painel Administrativo",
    subtitle: "Gestão global de usuários e monitoramento do sistema.",
    users: "Usuários Registrados",
    stats: "Estatísticas do Sistema",
    search: "Buscar por nome ou e-mail...",
    deleteConfirm: "Excluir conta permanentemente?",
    totalUsers: "Total de Alunos",
    activePoints: "Pontos Globais",
    name: "Nome",
    email: "E-mail",
    points: "IPs",
    actions: "Ações",
    loading: "Carregando Banco de Dados...",
    empty: "Nenhum usuário encontrado.",
    addPoints: "Dar IPs",
    remPoints: "Remover IPs",
    noData: "Sem dados disponíveis."
  },
  en: {
    title: "Admin Panel",
    subtitle: "Global user management and system monitoring.",
    users: "Registered Users",
    stats: "System Stats",
    search: "Search by name or email...",
    deleteConfirm: "Permanently delete account?",
    totalUsers: "Total Students",
    activePoints: "Global Points",
    name: "Name",
    email: "Email",
    points: "IPs",
    actions: "Actions",
    loading: "Loading Database...",
    empty: "No users found.",
    addPoints: "Add IPs",
    remPoints: "Remove IPs",
    noData: "No data available."
  }
};

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, isDark, lang }) => {
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const t = translations[lang];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await cloud.getGlobalAccounts();
    setAccounts(data);
    setLoading(false);
  };

  const handleDeleteUser = async (email: string) => {
    if (window.confirm(t.deleteConfirm)) {
      await cloud.deleteGlobalAccount(email);
      loadData();
    }
  };

  const handleAdjustPoints = async (email: string, amount: number) => {
    const user = accounts.find(a => a.email === email);
    if (user) {
      const newPoints = Math.max(0, user.points + amount);
      await cloud.updateGlobalUserPoints(email, newPoints);
      loadData();
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) || 
    acc.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPoints = accounts.reduce((sum, acc) => sum + acc.points, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full">
          <button 
            onClick={onBack}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-500" />
              {t.title}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.subtitle}</p>
          </div>
        </div>

        <div className={`relative w-full sm:w-80`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className={`w-full pl-10 pr-4 py-3 rounded-2xl border-2 outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest">{t.totalUsers}</h4>
          </div>
          <p className="text-4xl font-black">{accounts.length}</p>
        </div>
        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest">{t.activePoints}</h4>
          </div>
          <p className="text-4xl font-black text-amber-500">{totalPoints}</p>
        </div>
      </div>

      <div className={`rounded-[2rem] border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <th className="p-5 text-xs font-bold uppercase text-slate-500">{t.name}</th>
                <th className="p-5 text-xs font-bold uppercase text-slate-500">{t.email}</th>
                <th className="p-5 text-xs font-bold uppercase text-slate-500">{t.points}</th>
                <th className="p-5 text-xs font-bold uppercase text-slate-500 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-2" />
                    <p className="text-slate-500 font-bold">{t.loading}</p>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-slate-500 font-bold">{t.empty}</td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.email} className={`border-t transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className="p-5 font-bold">{acc.name}</td>
                    <td className="p-5 text-slate-500 text-sm">{acc.email}</td>
                    <td className="p-5">
                      <span className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-xs font-black">
                        {acc.points} IP
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleAdjustPoints(acc.email, 10)}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                          title={t.addPoints}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleAdjustPoints(acc.email, -10)}
                          className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                          title={t.remPoints}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(acc.email)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
