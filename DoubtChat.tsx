import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  type ChatMessage,
  type ChatSession,
  createSession,
  deriveTitle,
  loadSessions,
  saveSessions,
  sendDoubt,
} from '@/lib/doubt-chat';

const SUGGESTED_QUESTIONS = [
  'Explain Newton\'s second law with an example',
  'What is binary search? Explain step by step',
  'Solve: differentiate x^3 + 2x^2',
  'What is normalization in DBMS?',
];

export default function DoubtChat() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const openForPaper = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string; year?: number; subject?: string }>).detail ?? {};
      const paperContext = [detail.title, detail.subject, detail.year].filter(Boolean).join(' · ');
      setInput(paperContext
        ? `I am studying this question paper: ${paperContext}. Please help me understand and solve questions from it. My doubt is: `
        : 'Please help me understand this question paper. My doubt is: ');
      setShowHistory(false);
      setOpen(true);
      setError(null);
    };
    window.addEventListener('itpro:ask-about-paper', openForPaper);
    return () => window.removeEventListener('itpro:ask-about-paper', openForPaper);
  }, []);

  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSession(loaded[0]);
    } else {
      setActiveSession(createSession());
    }
  }, []);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, activeSession?.messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const persist = (updated: ChatSession[]) => {
    setSessions(updated);
    saveSessions(updated);
  };

  const updateSession = (session: ChatSession) => {
    const updated = [session, ...sessions.filter((s) => s.id !== session.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
    persist(updated);
    setActiveSession(session);
  };

  const handleSend = async () => {
    if (!activeSession || loading) return;
    const text = input.trim();
    if (!text) return;

    setError(null);
    setInput('');

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const sessionWithUser: ChatSession = {
      ...activeSession,
      messages: [...activeSession.messages, userMessage],
      title: activeSession.messages.length === 0 ? deriveTitle([userMessage]) : activeSession.title,
      updatedAt: Date.now(),
    };
    updateSession(sessionWithUser);

    setLoading(true);
    try {
      const reply = await sendDoubt(text, sessionWithUser.messages);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      const sessionWithReply: ChatSession = {
        ...sessionWithUser,
        messages: [...sessionWithUser.messages, assistantMessage],
        updatedAt: Date.now(),
      };
      updateSession(sessionWithReply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleNewChat = () => {
    const fresh = createSession();
    setActiveSession(fresh);
    setError(null);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session);
    setShowHistory(false);
    setError(null);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    persist(updated);
    if (activeSession?.id === id) {
      setActiveSession(updated[0] ?? createSession());
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI doubt chat"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-stone-900/20 transition-all duration-300 hover:scale-105 hover:bg-gold-800 sm:bottom-6 sm:right-6"
      >
        <Sparkles className="h-5 w-5 text-gold-400" />
        <span className="hidden sm:inline">Ask AI</span>
        <span className="sm:hidden">Ask</span>
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-sm md:hidden"
        onClick={() => setOpen(false)}
      />
      <div className="fixed bottom-0 right-0 z-50 flex h-[100dvh] w-full flex-col bg-white shadow-2xl md:bottom-6 md:right-6 md:h-[600px] md:w-[420px] md:rounded-2xl md:border md:border-stone-200 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:rounded-t-2xl">
          <div className="flex items-center gap-2">
            {showHistory ? (
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="flex items-center gap-1 text-sm font-semibold text-stone-700 transition-colors hover:text-gold-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-gold-700">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-sm font-bold text-stone-900">AI Doubt Helper</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!showHistory && (
              <button
                type="button"
                onClick={handleNewChat}
                aria-label="New chat"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-gold-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              aria-label="Chat history"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                showHistory ? 'bg-gold-100 text-gold-800' : 'text-stone-600 hover:bg-stone-100 hover:text-gold-800'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-rose-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {showHistory ? (
          <HistoryPanel
            sessions={sessions}
            activeId={activeSession?.id}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
          />
        ) : (
          <ChatPanel
            session={activeSession}
            loading={loading}
            error={error}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            onSuggestion={(q) => setInput(q)}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
          />
        )}
      </div>
    </>
  );
}

function ChatPanel({
  session,
  loading,
  error,
  input,
  onInputChange,
  onSend,
  onKeyDown,
  onSuggestion,
  messagesEndRef,
  inputRef,
}: {
  session: ChatSession | null;
  loading: boolean;
  error: string | null;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSuggestion: (q: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const messages = session?.messages ?? [];
  const isEmpty = messages.length === 0;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-gold-700">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-base font-bold text-stone-900">Ask your academic doubt</h2>
            <p className="mt-1 max-w-[260px] text-sm text-stone-600">
              Maths, Physics, Chemistry, Computer Science — get clear answers in English and Tamil.
            </p>
            <div className="mt-5 flex w-full flex-col gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onSuggestion(q)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-stone-700 transition-all hover:border-gold-400 hover:bg-gold-50 hover:text-gold-800"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isEmpty && (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
                Thinking...
              </div>
            )}
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type your doubt..."
            className="max-h-32 flex-1 resize-none rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-200/60"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white transition-all duration-200 hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-stone-400">
          AI answers are for learning. Always verify with your teacher.
        </p>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-stone-900 text-white'
            : 'bg-gold-50 text-stone-800 ring-1 ring-gold-200/60'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function HistoryPanel({
  sessions,
  activeId,
  onSelect,
  onDelete,
}: {
  sessions: ChatSession[];
  activeId?: string;
  onSelect: (s: ChatSession) => void;
  onDelete: (id: string) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-stone-500">
        <MessageCircle className="h-8 w-8 text-stone-300" />
        <p className="mt-3">No chat history yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <ul className="space-y-1.5">
        {sessions.map((session) => (
          <li key={session.id}>
            <div
              className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
                activeId === session.id
                  ? 'border-gold-300 bg-gold-50'
                  : 'border-transparent hover:bg-stone-50'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(session)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-semibold text-stone-800">{session.title}</p>
                <p className="mt-0.5 text-xs text-stone-400">
                  {session.messages.length} {session.messages.length === 1 ? 'message' : 'messages'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(session.id)}
                aria-label="Delete chat"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
