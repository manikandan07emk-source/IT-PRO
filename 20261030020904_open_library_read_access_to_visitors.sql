/*
# Open read-only library access to visitors

1. Purpose
- The app no longer has sign-in, so visitors use it without an account.
- Visitors can read the college, department and subject catalog and approved question papers.

2. Security changes
- Grants SELECT to the `anon` role on colleges, departments, subjects and question_papers.
- New SELECT policies for `anon` and `authenticated`:
  - colleges, departments, subjects: all rows (public reference data).
  - question_papers: approved rows only. Pending uploads stay hidden from visitors.
- New SELECT policy on the private `question-papers` storage bucket that lets visitors read files of approved papers only.
- Nothing else changes: visitors cannot insert, update or delete anything.

3. Notes
- Existing data is not modified.
*/

GRANT SELECT ON colleges, departments, subjects, question_papers TO anon;

DROP POLICY IF EXISTS "select_colleges_public" ON colleges;
CREATE POLICY "select_colleges_public" ON colleges FOR SELECT
  TO anon USING (true);

DROP POLICY IF EXISTS "select_departments_public" ON departments;
CREATE POLICY "select_departments_public" ON departments FOR SELECT
  TO anon USING (true);

DROP POLICY IF EXISTS "select_subjects_public" ON subjects;
CREATE POLICY "select_subjects_public" ON subjects FOR SELECT
  TO anon USING (true);

DROP POLICY IF EXISTS "select_approved_papers_public" ON question_papers;
CREATE POLICY "select_approved_papers_public" ON question_papers FOR SELECT
  TO anon, authenticated USING (status = 'approved');

DROP POLICY IF EXISTS "read_approved_question_paper_files_public" ON storage.objects;
CREATE POLICY "read_approved_question_paper_files_public" ON storage.objects FOR SELECT
  TO anon USING (
    bucket_id = 'question-papers' AND EXISTS (
      SELECT 1 FROM public.question_papers p
      WHERE p.storage_path = storage.objects.name AND p.status = 'approved'
    )
  );
