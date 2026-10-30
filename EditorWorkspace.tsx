import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, BookPlus, FileUp, FolderOpen, Loader2, LogOut, Sparkles } from 'lucide-react';
import { fetchCatalog, type Catalog } from '@/lib/catalog';
import { signOutEditor } from '@/lib/auth';
import UploadPaperForm from '@/components/editor/UploadPaperForm';
import ManagePapers from '@/components/editor/ManagePapers';
import CatalogManager from '@/components/editor/CatalogManager';
import AiQuestionHelper from '@/components/editor/AiQuestionHelper';

type EditorWorkspaceProps = {
  userId: string;
  email: string;
};

type EditorTab = 'upload' | 'papers' | 'catalog' | 'ai';

const TABS: { id: EditorTab; label: string; icon: typeof FileUp }[] = [
  { id: 'upload', label: 'Upload paper', icon: FileUp },
  { id: 'papers', label: 'Manage papers', icon: FolderOpen },
  { id: 'catalog', label: 'Colleges & subjects', icon: BookPlus },
  { id: 'ai', label: 'AI helper', icon: Sparkles },
];

export default function EditorWorkspace({ userId, email }: EditorWorkspaceProps) {
  const [tab, setTab] = useState<EditorTab>('upload');
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setCatalogError(null);
    try {
      setCatalog(await fetchCatalog());
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Could not load colleges and subjects.');
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOutEditor();
    } catch (err) {
      setSignOutError(err instanceof Error ? err.message : 'Could not sign out.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gold-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">Editor</p>
          <h1 className="mt-1 text-2xl font-extrabold text-stone-900 sm:text-3xl">Library workspace</h1>
          <p className="mt-1 text-sm text-stone-600">Signed in as {email}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex items-center justify-center gap-2 self-start rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-gold-400 hover:text-gold-800 sm:self-auto"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>

      {signOutError && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {signOutError}
        </p>
      )}

      <nav aria-label="Editor sections" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-gold-700 text-white shadow-sm'
                  : 'border border-stone-200 bg-white text-stone-700 hover:border-gold-400 hover:text-gold-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {catalogError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{catalogError}</span>
        </div>
      )}

      {!catalog && !catalogError && <LoadingBlock />}

      {catalog && (
        <>
          {tab === 'upload' && <UploadPaperForm catalog={catalog} userId={userId} />}
          {tab === 'papers' && <ManagePapers />}
          {tab === 'catalog' && <CatalogManager catalog={catalog} onChanged={loadCatalog} />}
          {tab === 'ai' && <AiQuestionHelper />}
        </>
      )}
    </section>
  );
}

function LoadingBlock(): ReactNode {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-7 w-7 animate-spin text-gold-600" />
    </div>
  );
}
