import { useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload } from 'lucide-react';
import { EXAM_TYPE_LABELS, formatFileSize } from '@/lib/constants';
import { MAX_PAPER_BYTES, uploadPaper } from '@/lib/editor-papers';
import type { Catalog } from '@/lib/catalog';
import type { ExamType } from '@/lib/types';
import { Field, inputClass, selectClass } from '@/components/editor/FormField';

type UploadPaperFormProps = {
  catalog: Catalog;
  userId: string;
};

const EXAM_TYPES: ExamType[] = ['previous_year', 'semester', 'model'];
const MIN_YEAR = 1990;
const MAX_YEAR = 2100;

export default function UploadPaperForm({ catalog, userId }: UploadPaperFormProps) {
  const [collegeId, setCollegeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examType, setExamType] = useState<ExamType>('previous_year');
  const [examYear, setExamYear] = useState(String(new Date().getFullYear()));
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const departments = useMemo(
    () => catalog.departments.filter((d) => d.college_id === collegeId),
    [catalog.departments, collegeId]
  );
  const subjects = useMemo(
    () => catalog.subjects.filter((s) => s.department_id === departmentId).sort((a, b) => a.name.localeCompare(b.name)),
    [catalog.subjects, departmentId]
  );

  const hasSubjects = catalog.subjects.length > 0;

  const handleCollegeChange = (value: string) => {
    setCollegeId(value);
    setDepartmentId('');
    setSubjectId('');
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentId(value);
    setSubjectId('');
  };

  const handleFileChange = (picked: File | null) => {
    setError(null);
    setSuccess(null);
    if (!picked) {
      setFile(null);
      return;
    }
    if (picked.type !== 'application/pdf' && !picked.name.toLowerCase().endsWith('.pdf')) {
      setFile(null);
      setError('Please choose a PDF file.');
      return;
    }
    if (picked.size > MAX_PAPER_BYTES) {
      setFile(null);
      setError('This file is larger than 20 MB. Please choose a smaller PDF.');
      return;
    }
    setFile(picked);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const year = Number(examYear);
    const subject = catalog.subjects.find((s) => s.id === subjectId);
    if (!subject) {
      setError('Choose the subject this paper belongs to.');
      return;
    }
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
      setError(`Enter an exam year between ${MIN_YEAR} and ${MAX_YEAR}.`);
      return;
    }
    if (!file) {
      setError('Choose a PDF file to upload.');
      return;
    }

    const finalTitle = title.trim() || `${subject.name} · ${EXAM_TYPE_LABELS[examType]} ${year}`;

    setSubmitting(true);
    try {
      await uploadPaper({ subjectId: subject.id, title: finalTitle, examType, examYear: year, file }, userId);
      setSuccess(`"${finalTitle}" is now live in the library.`);
      setTitle('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The paper could not be uploaded.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasSubjects) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
        <h2 className="text-lg font-bold text-stone-900">Add a subject first</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
          Papers are filed under subjects. Open the Colleges and subjects tab to add your first college, department and subject.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-6 animate-fade-up lg:grid-cols-[1fr_1fr]">
      <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900">Where does this paper belong?</h2>

        <Field label="College">
          <select className={selectClass} value={collegeId} onChange={(e) => handleCollegeChange(e.target.value)}>
            <option value="">Choose a college</option>
            {catalog.colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Department">
          <select
            className={selectClass}
            value={departmentId}
            disabled={!collegeId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
          >
            <option value="">Choose a department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Subject">
          <select
            className={selectClass}
            value={subjectId}
            disabled={!departmentId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">Choose a subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code ? `${s.code} · ${s.name}` : s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900">Paper details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Exam type">
            <select className={selectClass} value={examType} onChange={(e) => setExamType(e.target.value as ExamType)}>
              {EXAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EXAM_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Exam year">
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Title (optional)">
          <input
            className={inputClass}
            value={title}
            maxLength={150}
            placeholder="Leave blank to use the subject and exam details"
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <div>
          <span className="mb-2 block text-sm font-semibold text-stone-700">PDF file</span>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold-300 bg-gold-50/50 px-6 py-8 text-center transition-colors hover:border-gold-500 hover:bg-gold-50">
            <FileUp className="h-7 w-7 text-gold-700" />
            <span className="text-sm font-semibold text-stone-800">
              {file ? file.name : 'Choose a PDF (up to 20 MB)'}
            </span>
            {file && <span className="text-xs text-stone-500">{formatFileSize(file.size)}</span>}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {submitting ? 'Publishing...' : 'Publish paper'}
        </button>
      </div>
    </form>
  );
}
