import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Loader2, Plus } from 'lucide-react';
import type { Catalog } from '@/lib/catalog';
import { addCollege, addDepartment, addSubject } from '@/lib/catalog-admin';
import { YEAR_LABELS, YEAR_LEVELS, semestersForYear } from '@/lib/constants';
import type { CollegeCategory } from '@/lib/types';
import { Field, inputClass, selectClass } from '@/components/editor/FormField';

const CATEGORIES: CollegeCategory[] = ['Engineering', 'Arts & Science', 'Polytechnic', 'Other'];

type CatalogManagerProps = {
  catalog: Catalog;
  onChanged: () => Promise<void>;
};

export default function CatalogManager({ catalog, onChanged }: CatalogManagerProps) {
  return (
    <div className="grid gap-6 animate-fade-up lg:grid-cols-3">
      <CollegeForm onChanged={onChanged} />
      <DepartmentForm catalog={catalog} onChanged={onChanged} />
      <SubjectForm catalog={catalog} onChanged={onChanged} />
    </div>
  );
}

type FormSubmit = (run: () => Promise<void>) => Promise<void>;

function useFormState(onChanged: () => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit: FormSubmit = async (run) => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await run();
      await onChanged();
      setSuccess('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return { saving, error, success, submit, setError };
}

function FormShell({
  title,
  children,
  onSubmit,
  saving,
  error,
  success,
  submitLabel,
}: {
  title: string;
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  error: string | null;
  success: string | null;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-stone-900">{title}</h2>
      {children}
      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {submitLabel}
      </button>
    </form>
  );
}

function CollegeForm({ onChanged }: { onChanged: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CollegeCategory>('Engineering');
  const { saving, error, success, submit, setError } = useFormState(onChanged);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter the college name.');
      return;
    }
    void submit(async () => {
      await addCollege(trimmed, category);
      setName('');
    });
  };

  return (
    <FormShell title="Add a college" onSubmit={handleSubmit} saving={saving} error={error} success={success} submitLabel="Add college">
      <Field label="College name">
        <input className={inputClass} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Category">
        <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value as CollegeCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
    </FormShell>
  );
}

function DepartmentForm({ catalog, onChanged }: { catalog: Catalog; onChanged: () => Promise<void> }) {
  const [collegeId, setCollegeId] = useState('');
  const [name, setName] = useState('');
  const { saving, error, success, submit, setError } = useFormState(onChanged);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!collegeId) {
      setError('Choose the college first.');
      return;
    }
    if (!trimmed) {
      setError('Enter the department name.');
      return;
    }
    void submit(async () => {
      await addDepartment(collegeId, trimmed);
      setName('');
    });
  };

  return (
    <FormShell title="Add a department" onSubmit={handleSubmit} saving={saving} error={error} success={success} submitLabel="Add department">
      <Field label="College">
        <select className={selectClass} value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
          <option value="">Choose a college</option>
          {catalog.colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Department name">
        <input className={inputClass} value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
      </Field>
    </FormShell>
  );
}

function SubjectForm({ catalog, onChanged }: { catalog: Catalog; onChanged: () => Promise<void> }) {
  const [collegeId, setCollegeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [yearLevel, setYearLevel] = useState(1);
  const [semester, setSemester] = useState(1);
  const { saving, error, success, submit, setError } = useFormState(onChanged);

  const departments = catalog.departments.filter((d) => d.college_id === collegeId);
  const semesterOptions = semestersForYear(yearLevel);

  const handleYearChange = (value: number) => {
    setYearLevel(value);
    setSemester(semestersForYear(value)[0]);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!departmentId) {
      setError('Choose the department first.');
      return;
    }
    if (!trimmed) {
      setError('Enter the subject name.');
      return;
    }
    void submit(async () => {
      await addSubject({
        departmentId,
        name: trimmed,
        code: code.trim(),
        yearLevel,
        semester,
      });
      setName('');
      setCode('');
    });
  };

  return (
    <FormShell title="Add a subject" onSubmit={handleSubmit} saving={saving} error={error} success={success} submitLabel="Add subject">
      <Field label="College">
        <select
          className={selectClass}
          value={collegeId}
          onChange={(e) => {
            setCollegeId(e.target.value);
            setDepartmentId('');
          }}
        >
          <option value="">Choose a college</option>
          {catalog.colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Department">
        <select className={selectClass} value={departmentId} disabled={!collegeId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">Choose a department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Subject name">
        <input className={inputClass} value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Subject code (optional)">
        <input className={inputClass} value={code} maxLength={20} onChange={(e) => setCode(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Year">
          <select className={selectClass} value={yearLevel} onChange={(e) => handleYearChange(Number(e.target.value))}>
            {YEAR_LEVELS.map((year) => (
              <option key={year} value={year}>
                {YEAR_LABELS[year]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Semester">
          <select className={selectClass} value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
            {semesterOptions.map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </FormShell>
  );
}
