import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FileText, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { EXAM_TYPE_LABELS, formatFileSize } from '@/lib/constants';
import { deletePaper, fetchAllPapers } from '@/lib/editor-papers';
import type { ManagedPaper } from '@/lib/types';

export default function ManagePapers() {
  const [papers, setPapers] = useState<ManagedPaper[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPapers = useCallback(async () => {
    setLoadError(null);
    try {
      setPapers(await fetchAllPapers());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load papers.');
    }
  }, []);

  useEffect(() => {
    void loadPapers();
  }, [loadPapers]);

  const handleDeleted = (id: string) => {
    setPapers((current) => current?.filter((p) => p.id !== id) ?? null);
  };

  if (loadError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-800">
        <AlertCircle className="h-6 w-6" />
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => void loadPapers()}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-rose-800 ring-1 ring-rose-200 transition-colors hover:bg-rose-100"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!papers) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-gold-600" />
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
        <h2 className="text-lg font-bold text-stone-900">No papers yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">Papers you publish will be listed here so you can remove them later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-up">
      <p className="text-sm text-stone-600">
        {papers.length} {papers.length === 1 ? 'paper' : 'papers'} in the library
      </p>
      <ul className="space-y-3">
        {papers.map((paper) => (
          <PaperRow key={paper.id} paper={paper} onDeleted={handleDeleted} />
        ))}
      </ul>
    </div>
  );
}

function PaperRow({ paper, onDeleted }: { paper: ManagedPaper; onDeleted: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      await deletePaper(paper);
      onDeleted(paper.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This paper could not be deleted.');
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
        <FileText className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-bold text-stone-900" title={paper.title}>
          {paper.title}
        </h3>
        <p className="mt-1 text-xs text-stone-500">
          {paper.subjects ? `${paper.subjects.code ? `${paper.subjects.code} · ` : ''}${paper.subjects.name}` : 'Unknown subject'}
          {' · '}
          {EXAM_TYPE_LABELS[paper.exam_type]} {paper.exam_year}
          {' · '}
          {formatFileSize(paper.file_size)}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-60"
          >
            Keep
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete permanently
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      )}
    </li>
  );
}
