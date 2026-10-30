import { supabase } from '@/lib/supabase';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = 'itpro-doubt-chat-sessions';
const MAX_SESSIONS = 20;
const MAX_HISTORY_TURNS = 10;

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChatSession[];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  try {
    const trimmed = sessions.slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full or unavailable — non-critical
  }
}

export function createSession(): ChatSession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New chat';
  const text = firstUser.content.trim();
  return text.length > 40 ? `${text.slice(0, 40)}...` : text;
}

export async function sendDoubt(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const apiHistory = history.slice(-MAX_HISTORY_TURNS * 2).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const { data, error } = await supabase.functions.invoke<{ text?: unknown }>('ai-doubt-chat', {
    body: { message, history: apiHistory },
  });
  if (error) throw new Error('The AI chat is unavailable right now. Please try again.');
  if (!data || typeof data.text !== 'string') {
    throw new Error('The AI chat returned an unexpected answer. Please try again.');
  }
  return data.text;
}
