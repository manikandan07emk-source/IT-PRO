import { PAPER_BUCKET } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Paper } from '@/lib/types';

const PAPER_COLUMNS =
  'id, subject_id, title, exam_type, exam_year, storage_path, file_name, file_size, status, uploaded_by, created_at';

export async function fetchSubjectPapers(subjectId: string): Promise<Paper[]> {
  const { data, error } = await supabase
    .from('question_papers')
    .select(PAPER_COLUMNS)
    .eq('subject_id', subjectId)
    .eq('status', 'approved')
    .order('exam_year', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Paper[];
}

export async function fetchApprovedPaperCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('question_papers')
    .select('subject_id')
    .eq('status', 'approved');
  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { subject_id: string }[]) {
    counts[row.subject_id] = (counts[row.subject_id] ?? 0) + 1;
  }
  return counts;
}

export async function getPaperDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PAPER_BUCKET)
    .createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Could not create a download link.');
  }
  return data.signedUrl;
}
