import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, BookMarked, Loader2, RefreshCw, SearchX } from 'lucide-react';
import { fetchCatalog, type Catalog } from '@/lib/catalog';
import { fetchApprovedPaperCounts } from '@/lib/papers';
import { YEAR_LABELS } from '@/lib/constants';
import type { Subject } from '@/lib/types';
import SubjectPapers from '@/components/library/SubjectPapers';
import ChoiceCard from '@/components/library/ChoiceCard';
import LibraryFilters from '@/components/library/LibraryFilters';
import { EMPTY_FILTERS, type LibraryFilterValues } from '@/lib/library-filters';

type LibraryData = Catalog & { paperCounts: Record<string, number> };

export default function LibraryBrowser() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LibraryFilterValues>(EMPTY_FILTERS);
  const [openSubject, setOpenSubject] = useState<Subject | null>(null);

  const loadLibrary = useCallback(async () => {
    setLoadError(null);
    try {
      const [catalog, paperCounts] = await Promise.all([fetchCatalog(), fetchApprovedPaperCounts()]);
      setData({ ...catalog, paperCounts });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Something went wrong while loading.');
    }
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const departmentById = useMemo(
    () => new Map(data?.departments.map((d) => [d.id, d]) ?? []),
    [data]
  );
  const collegeById = useMemo(
    () => new Map(data?.colleges.map((c) => [c.id, c]) ?? []),
    [data]
  );

  const matchingSubjects = useMemo(() => {
    if (!data) return [];
    const query = filters.query.trim().toLowerCase();
    return data.subjects
      .filter((s) => {
        const dept = departmentById.get(s.department_id);
        if (!dept) return false;
        if (filters.collegeId && dept.college_id !== filters.collegeId) return false;
        if (filters.departmentId && s.department_id !== filters.departmentId) return false;
        if (filters.year && s.year_level !== Number(filters.year)) return false;
        if (filters.semester && s.semester !== Number(filters.semester)) return false;
        if (query && !s.name.toLowerCase().includes(query) && !s.code.toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => a.year_level - b.year_level || a.semester - b.semester || a.name.localeCompare(b.name));
  }, [data, departmentById, filters]);

  if (!data) {
    return loadError ? (
      <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm animate-fade-up">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
        <h2 className="mt-4 text-lg font-bold text-stone-900">We could not load the library</h2>
        <p className="mt-2 text-sm text-stone-600">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadLibrary()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gold-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-800"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    ) : (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
      </div>
    );
  }

  if (openSubject) {
    const dept = departmentById.get(openSubject.department_id);
    const college = dept ? collegeById.get(dept.college_id) : undefined;
    const contextLabel = [college?.name, dept?.name, YEAR_LABELS[openSubject.year_level], `Semester ${openSubject.semester}`]
      .filter(Boolean)
      .join(' · ');
    return (
      <section className="space-y-6">
        <button
          type="button"
          onClick={() => setOpenSubject(null)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 hover:text-gold-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to subjects
        </button>
        <SubjectPapers subject={openSubject} contextLabel={contextLabel} />
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-extrabold text-stone-900 sm:text-4xl">Question paper library</h1>
        <p className="mt-2 text-base text-stone-600">
          Filter by department, academic year and semester, then open a subject to view its past papers.
        </p>
      </div>

      <LibraryFilters
        values={filters}
        colleges={data.colleges}
        departments={data.departments}
        resultCount={matchingSubjects.length}
        onChange={setFilters}
      />

      {matchingSubjects.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
            <SearchX className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-lg font-bold text-stone-900">No subjects match these filters</h2>
          <p className="mt-2 max-w-sm text-sm text-stone-600">Try clearing a filter or choosing a different semester.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matchingSubjects.map((subject, index) => {
            const dept = departmentById.get(subject.department_id);
            const count = data.paperCounts[subject.id] ?? 0;
            const details = [
              subject.code || null,
              dept?.name,
              `Semester ${subject.semester}`,
              `${count} ${count === 1 ? 'paper' : 'papers'}`,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <ChoiceCard
                key={subject.id}
                index={index}
                icon={BookMarked}
                title={subject.name}
                subtitle={details}
                onClick={() => setOpenSubject(subject)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
