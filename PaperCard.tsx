import { useState } from 'react';
import { Download, FileText, Loader2, Sparkles } from 'lucide-react';
import { EXAM_TYPE_LABELS, formatFileSize } from '@/lib/constants';
import { getPaperDownloadUrl } from '@/lib/papers';
import type { Paper } from '@/lib/types';

type PaperCardProps = {
  paper: Paper;
  index: number;
};

export default function PaperCard({ paper, index }: PaperCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAskAI = () => {
    window.dispatchEvent(new CustomEvent('itpro:ask-about-paper', {
      detail: { title: paper.title, year: paper.exam_year },
    }));
  };

  const handleDownload = async () => {
    setActionError(null);
    setDownloading(true);
    try {
      const url = await getPaperDownloadUrl(paper.storage_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not open this paper.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="group flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-300 animate-fade-up hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-lg hover:shadow-gold-900/5"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 transition-colors group-hover:bg-gold-50 group-hover:text-gold-700">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-stone-900" title={paper.title}>
            {paper.title}
          </h3>
          <p className="mt-1 truncate text-xs text-stone-500" title={paper.file_name}>
            {paper.file_name} · {formatFileSize(paper.file_size)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-gold-50 px-2.5 py-1 text-xs font-semibold text-gold-800 ring-1 ring-gold-200">
          {EXAM_TYPE_LABELS[paper.exam_type]}
        </span>
        <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">{paper.exam_year}</span>
      </div>

      {actionError && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {actionError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 border-t border-stone-100 pt-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAskAI}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-300 bg-gold-50 px-4 py-2.5 text-sm font-semibold text-gold-800 transition-all duration-200 hover:bg-gold-100"
        >
          <Sparkles className="h-4 w-4" />
          Ask AI about this paper
        </button>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF
        </button>
      </div>
    </article>
  );
}
