
import { User, StudyHistoryEntry, StoredAccount } from '../types';

// Simulação de um Banco de Dados Global na Nuvem
const CLOUD_DB_KEY = 'primarral_global_cloud_db';

const simulateLatency = () => new Promise(resolve => setTimeout(resolve, 600));

export const getGlobalAccounts = async (): Promise<StoredAccount[]> => {
  await simulateLatency();
  const data = localStorage.getItem(CLOUD_DB_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveGlobalAccount = async (account: StoredAccount): Promise<void> => {
  await simulateLatency();
  const accounts = await getGlobalAccounts();
  const emailLower = account.email.toLowerCase().trim();
  
  const existingIdx = accounts.findIndex(a => a.email.toLowerCase().trim() === emailLower);
  
  if (existingIdx !== -1) {
    accounts[existingIdx] = { ...accounts[existingIdx], ...account };
  } else {
    accounts.push({
      ...account,
      email: emailLower
    });
  }
  
  localStorage.setItem(CLOUD_DB_KEY, JSON.stringify(accounts));
};

export const syncUserData = async (email: string, data: Partial<User>): Promise<void> => {
  await simulateLatency();
  const accounts = await getGlobalAccounts();
  const idx = accounts.findIndex(a => a.email.toLowerCase().trim() === email.toLowerCase().trim());
  
  if (idx !== -1) {
    accounts[idx] = { 
      ...accounts[idx], 
      points: data.points !== undefined ? data.points : accounts[idx].points,
      preferences: data.preferences !== undefined ? data.preferences : accounts[idx].preferences,
      name: data.name || accounts[idx].name
    };
    localStorage.setItem(CLOUD_DB_KEY, JSON.stringify(accounts));
  }
};

export const getGlobalHistory = async (email: string): Promise<StudyHistoryEntry[]> => {
  await simulateLatency();
  const key = `primarral_cloud_history_${email.toLowerCase().trim()}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveGlobalHistory = async (email: string, history: StudyHistoryEntry[]): Promise<void> => {
  await simulateLatency();
  const key = `primarral_cloud_history_${email.toLowerCase().trim()}`;
  localStorage.setItem(key, JSON.stringify(history));
};

// --- ADMIN FUNCTIONS ---

export const deleteGlobalAccount = async (email: string): Promise<void> => {
  await simulateLatency();
  const accounts = await getGlobalAccounts();
  const filtered = accounts.filter(a => a.email.toLowerCase().trim() !== email.toLowerCase().trim());
  localStorage.setItem(CLOUD_DB_KEY, JSON.stringify(filtered));
  localStorage.removeItem(`primarral_cloud_history_${email.toLowerCase().trim()}`);
};

export const updateGlobalUserPoints = async (email: string, points: number): Promise<void> => {
  await simulateLatency();
  const accounts = await getGlobalAccounts();
  const idx = accounts.findIndex(a => a.email.toLowerCase().trim() === email.toLowerCase().trim());
  if (idx !== -1) {
    accounts[idx].points = points;
    localStorage.setItem(CLOUD_DB_KEY, JSON.stringify(accounts));
  }
};
