import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, KeyRound, Loader2, LogOut, ShieldAlert, UserPlus } from 'lucide-react';
import { useEditorAccess } from '@/hooks/useEditorAccess';
import { navigateTo } from '@/lib/router';
import { signInWithEmail, signOutEditor, signUpWithEmail } from '@/lib/auth';
import EditorWorkspace from '@/components/editor/EditorWorkspace';

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-200/60';

export default function EditorArea() {
  const access = useEditorAccess();

  if (access.status === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
      </div>
    );
  }

  if (access.status === 'signed-out') return <SignInCard />;
  if (access.status === 'no-access') return <NoAccessCard email={access.email} />;
  return <EditorWorkspace userId={access.userId} email={access.email} />;
}

function SignInCard() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(trimmedEmail, password);
      } else {
        await signUpWithEmail(trimmedEmail, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-md animate-fade-up rounded-2xl border border-gold-200 bg-white p-8 shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-gold-700">
        <KeyRound className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-center text-2xl font-extrabold text-stone-900">
        {mode === 'signin' ? 'Editor sign-in' : 'Create editor account'}
      </h1>
      <p className="mt-2 text-center text-sm text-stone-600">
        {mode === 'signin'
          ? 'Sign in to upload papers and manage the library.'
          : 'The first account created becomes the editor. Visitors do not need an account.'}
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">Email</span>
          <input
            type="email"
            autoComplete="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">Password</span>
          <input
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </label>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin' ? <KeyRound className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError(null);
        }}
        className="mt-4 w-full text-center text-sm font-semibold text-gold-800 transition-colors hover:text-gold-900"
      >
        {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
      </button>

      <button
        type="button"
        onClick={() => navigateTo('library')}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to the library
      </button>
    </section>
  );
}

function NoAccessCard({ email }: { email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await signOutEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
      setSigningOut(false);
    }
  };

  return (
    <section className="mx-auto max-w-md animate-fade-up rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
        <ShieldAlert className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-stone-900">No editor access</h1>
      <p className="mt-2 text-sm text-stone-600">
        {email ? `${email} is signed in, but ` : 'This account '}is not an editor account, so the editor area is not available.
      </p>

      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-left text-sm text-rose-800">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        Sign out
      </button>
    </section>
  );
}
