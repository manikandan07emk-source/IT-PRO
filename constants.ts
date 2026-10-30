import type { ExamType } from '@/lib/types';

export const PAPER_BUCKET = 'question-papers';

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  previous_year: 'Previous year paper',
  semester: 'Semester exam',
  model: 'Model paper',
};

export const YEAR_LEVELS = [1, 2, 3, 4] as const;

export const YEAR_LABELS: Record<number, string> = {
  1: '1st Year',
  2: '2nd Year',
  3: '3rd Year',
  4: '4th Year',
};

export function semestersForYear(yearLevel: number): number[] {
  return [yearLevel * 2 - 1, yearLevel * 2];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
