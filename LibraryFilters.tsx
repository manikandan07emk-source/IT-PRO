import type { ReactNode } from 'react';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import { YEAR_LABELS, YEAR_LEVELS, semestersForYear } from '@/lib/constants';
import { EMPTY_FILTERS, type LibraryFilterValues } from '@/lib/library-filters';
import type { College, Department } from '@/lib/types';

type LibraryFiltersProps = {
  values: LibraryFilterValues;
  colleges: College[];
  departments: Department[];
  resultCount: number;
  onChange: (next: LibraryFilterValues) => void;
};

export default function LibraryFilters({ values, colleges, departments, resultCount, onChange }: LibraryFiltersProps) {
  const collegeName = (id: string) => colleges.find((c) => c.id === id)?.name ?? '';
  const visibleDepartments = values.collegeId
    ? departments.filter((d) => d.college_id === values.collegeId)
    : departments;
  const semesterOptions = values.year
    ? semestersForYear(Number(values.year))
    : [1, 2, 3, 4, 5, 6, 7, 8];

  const isActive = Object.values(values).some((value) => value !== '');

  const update = (patch: Partial<LibraryFilterValues>) => {
    const next = { ...values, ...patch };
    if (patch.collegeId !== undefined && patch.collegeId !== values.collegeId) {
      next.departmentId = '';
    }
    if (patch.year !== undefined && patch.year !== values.year) {
      const allowed = patch.year ? semestersForYear(Number(patch.year)) : [];
      if (next.semester && !allowed.includes(Number(next.semester))) next.semester = '';
    }
    onChange(next);
  };

  return (
    <section aria-label="Filter question papers" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-900">Filter subjects</h2>
          <p className="mt-0.5 text-sm text-stone-600">
            {resultCount === 1 ? '1 subject matches' : `${resultCount} subjects match`}
          </p>
        </div>
        {isActive && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gold-800 transition-colors hover:bg-gold-50"
          >
            <RotateCcw className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <FilterSelect label="College" value={values.collegeId} onChange={(v) => update({ collegeId: v })}>
          <option value="">All colleges</option>
          {colleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Department" value={values.departmentId} onChange={(v) => update({ departmentId: v })}>
          <option value="">All departments</option>
          {visibleDepartments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {values.collegeId ? dept.name : `${collegeName(dept.college_id)} · ${dept.name}`}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Academic year" value={values.year} onChange={(v) => update({ year: v })}>
          <option value="">All years</option>
          {YEAR_LEVELS.map((year) => (
            <option key={year} value={year}>
              {YEAR_LABELS[year]}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Semester" value={values.semester} onChange={(v) => update({ semester: v })}>
          <option value="">All semesters</option>
          {semesterOptions.map((sem) => (
            <option key={sem} value={sem}>
              Semester {sem}
            </option>
          ))}
        </FilterSelect>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">Search</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={values.query}
              onChange={(e) => update({ query: e.target.value })}
              placeholder="Name or code"
              className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-200/60"
            />
          </span>
        </label>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-stone-700">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-stone-200 bg-white py-3 pl-4 pr-10 text-sm text-stone-900 transition-all duration-200 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-200/60"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
      </span>
    </label>
  );
}
