
import { User, StudyHistoryEntry, StoredAccount } from '../types';

/**
 * CONFIGURAÇÃO DO SUPABASE (POSTGRESQL GRATUITO)
 */
const getDbConfig = () => {
  const win = window as any;
  return {
    url: win.SUPABASE_URL || "",
    key: win.SUPABASE_KEY || ""
  };
};

const isConfigured = () => {
  const config = getDbConfig();
  return config.url !== "" && config.key !== "";
};

const supabaseFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { url, key } = getDbConfig();
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  };

  const response = await fetch(`${url}/rest/v1/${endpoint}`, { ...options, headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Erro na conexão com Supabase";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch (e) {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Se o status for 204 (No Content), não tenta dar parse no JSON
  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

/**
 * LOGIN / BUSCA DE CONTAS
 */
export const getGlobalAccounts = async (): Promise<StoredAccount[]> => {
  if (isConfigured()) {
    try {
      const data = await supabaseFetch('accounts?select=*');
      return data || [];
    } catch (e) {
      console.error("Supabase Error:", e);
      return [];
    }
  }

  const data = localStorage.getItem('primarral_global_cloud_db');
  return data ? JSON.parse(data) : [];
};

/**
 * SALVAR NOVA CONTA OU ATUALIZAR
 */
export const saveGlobalAccount = async (account: StoredAccount): Promise<void> => {
  if (isConfigured()) {
    const emailLower = account.email.toLowerCase().trim();
    await supabaseFetch('accounts', {
      method: 'POST',
      body: JSON.stringify({ ...account, email: emailLower }),
      headers: { 'Prefer': 'resolution=merge-duplicates' }
    });
    return;
  }

  const accounts = await getGlobalAccounts();
  const emailLower = account.email.toLowerCase().trim();
  const existingIdx = accounts.findIndex(a => a.email.toLowerCase().trim() === emailLower);
  
  if (existingIdx !== -1) {
    accounts[existingIdx] = { ...accounts[existingIdx], ...account };
  } else {
    accounts.push({ ...account, email: emailLower });
  }
  localStorage.setItem('primarral_global_cloud_db', JSON.stringify(accounts));
};

/**
 * SINCRONIZAR PONTOS E PREFERÊNCIAS
 */
export const syncUserData = async (email: string, data: Partial<User>): Promise<void> => {
  if (isConfigured()) {
    await supabaseFetch(`accounts?email=eq.${encodeURIComponent(email.toLowerCase())}`, {
      method: 'PATCH',
      body: JSON.stringify({
        points: data.points,
        preferences: data.preferences,
        name: data.name
      })
    });
    return;
  }

  const accounts = await getGlobalAccounts();
  const idx = accounts.findIndex(a => a.email.toLowerCase().trim() === email.toLowerCase().trim());
  if (idx !== -1) {
    accounts[idx] = { ...accounts[idx], ...data };
    localStorage.setItem('primarral_global_cloud_db', JSON.stringify(accounts));
  }
};

/**
 * HISTÓRICO DE ESTUDOS
 */
export const getGlobalHistory = async (email: string): Promise<StudyHistoryEntry[]> => {
  if (isConfigured()) {
    try {
      const rows = await supabaseFetch(`history?user_email=eq.${encodeURIComponent(email.toLowerCase())}&select=*&order=date.desc`);
      if (!rows) return [];
      return rows.map((r: any) => ({
        ...r.data,
        id: r.id,
        date: r.date,
        topic: r.topic,
        description: r.description
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  const key = `primarral_cloud_history_${email.toLowerCase().trim()}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveGlobalHistory = async (email: string, history: StudyHistoryEntry[]): Promise<void> => {
  if (isConfigured() && history.length > 0) {
    const latest = history[0];
    await supabaseFetch('history', {
      method: 'POST',
      body: JSON.stringify({
        id: latest.id,
        user_email: email.toLowerCase(),
        date: latest.date,
        topic: latest.topic,
        description: latest.description,
        data: latest
      }),
      headers: { 'Prefer': 'resolution=merge-duplicates' }
    });
    return;
  }

  const key = `primarral_cloud_history_${email.toLowerCase().trim()}`;
  localStorage.setItem(key, JSON.stringify(history));
};

export const deleteGlobalAccount = async (email: string): Promise<void> => {
  if (isConfigured()) {
    await supabaseFetch(`accounts?email=eq.${encodeURIComponent(email.toLowerCase())}`, {
      method: 'DELETE'
    });
    return;
  }

  const accounts = await getGlobalAccounts();
  const filtered = accounts.filter(a => a.email.toLowerCase().trim() !== email.toLowerCase().trim());
  localStorage.setItem('primarral_global_cloud_db', JSON.stringify(filtered));
};

export const updateGlobalUserPoints = async (email: string, points: number): Promise<void> => {
  await syncUserData(email, { points });
};
