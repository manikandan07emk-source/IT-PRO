import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, Filter, Loader2, AlertCircle } from 'lucide-react';
import { EXAM_TYPE_LABELS } from '@/lib/constants';
import { fetchSubjectPapers } from '@/lib/papers';
import type { ExamType, Paper, Subject } from '@/lib/types';
import PaperCard from '@/components/library/PaperCard';

type SubjectPapersProps = {
  subject: Subject;
  contextLabel: string;
};

type ExamFilter = 'all' | ExamType;

export default function SubjectPapers({ subject, contextLabel }: SubjectPapersProps) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState<ExamFilter>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchSubjectPapers(subject.id)
      .then((list) => {
        if (active) setPapers(list);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load papers.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [subject.id]);

  const years = useMemo(
    () => Array.from(new Set(papers.map((p) => p.exam_year))).sort((a, b) => b - a),
    [papers]
  );

  const visible = papers.filter(
    (p) =>
      (examFilter === 'all' || p.exam_type === examFilter) &&
      (yearFilter === 'all' || p.exam_year === yearFilter)
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="rounded-2xl border border-gold-200 bg-gradient-to-br from-white to-gold-50 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">{contextLabel}</p>
        <h2 className="mt-1 text-2xl font-extrabold text-stone-900">{subject.name}</h2>
        {subject.code && <p className="mt-1 text-sm text-stone-600">Subject code {subject.code}</p>}
      </div>

      {papers.length > 0 && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="mr-1 h-4 w-4 text-stone-500" />
            {(['all', 'previous_year', 'semester', 'model'] as ExamFilter[]).map((option) => (
              <Chip key={option} active={examFilter === option} onClick={() => setExamFilter(option)}>
                {option === 'all' ? 'All types' : EXAM_TYPE_LABELS[option]}
              </Chip>
            ))}
          </div>
          {years.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Chip active={yearFilter === 'all'} onClick={() => setYearFilter('all')}>
                All years
              </Chip>
              {years.map((year) => (
                <Chip key={year} active={yearFilter === year} onClick={() => setYearFilter(year)}>
                  {year}
                </Chip>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-gold-600" />
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && papers.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-gold-700">
            <BookOpen className="h-6 w-6" />
          </span>
          <h3 className="mt-5 text-lg font-bold text-stone-900">No question papers yet</h3>
          <p className="mt-2 max-w-sm text-sm text-stone-600">Papers for this subject will appear here once they are added.</p>
        </div>
      )}

      {!loading && !error && papers.length > 0 && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-sm text-stone-600">
          No papers match these filters.
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((paper, index) => (
            <PaperCard key={paper.id} paper={paper} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-gold-700 text-white shadow-sm'
          : 'border border-stone-200 bg-white text-stone-700 hover:border-gold-400 hover:text-gold-800'
      }`}
    >
      {children}
    </button>
  );
}
