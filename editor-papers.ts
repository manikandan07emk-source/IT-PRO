import { PAPER_BUCKET } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { ExamType, ManagedPaper } from '@/lib/types';

export const MAX_PAPER_BYTES = 20 * 1024 * 1024;

export type UploadPaperInput = {
  subjectId: string;
  title: string;
  examType: ExamType;
  examYear: number;
  file: File;
};

export async function uploadPaper(input: UploadPaperInput, userId: string): Promise<void> {
  const storagePath = `${userId}/${crypto.randomUUID()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(PAPER_BUCKET)
    .upload(storagePath, input.file, { contentType: 'application/pdf', upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from('question_papers').insert({
    subject_id: input.subjectId,
    title: input.title,
    exam_type: input.examType,
    exam_year: input.examYear,
    storage_path: storagePath,
    file_name: input.file.name,
    file_size: input.file.size,
    status: 'approved',
    uploaded_by: userId,
  });
  if (error) {
    await supabase.storage.from(PAPER_BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }
}

export async function fetchAllPapers(): Promise<ManagedPaper[]> {
  const { data, error } = await supabase
    .from('question_papers')
    .select('id, title, exam_type, exam_year, storage_path, file_name, file_size, subjects(name, code)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ManagedPaper[];
}

export async function deletePaper(paper: ManagedPaper): Promise<void> {
  const { data, error } = await supabase
    .from('question_papers')
    .delete()
    .eq('id', paper.id)
    .select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('This paper could not be deleted.');

  const { error: storageError } = await supabase.storage.from(PAPER_BUCKET).remove([paper.storage_path]);
  if (storageError) throw new Error(storageError.message);
}
