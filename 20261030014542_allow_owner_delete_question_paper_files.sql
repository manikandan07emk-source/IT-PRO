/*
# Let students remove their own question paper files

1. Modified Security
- Adds a DELETE policy on the private `question-papers` storage bucket so a user can delete files inside their own folder.
- Needed so that when a student deletes their own pending paper, the PDF is removed too.

2. Notes
- No tables or data are changed.
*/

DROP POLICY IF EXISTS "delete_own_question_paper_files" ON storage.objects;
CREATE POLICY "delete_own_question_paper_files" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'question-papers' AND (storage.foldername(name))[1] = auth.uid()::text
  );
