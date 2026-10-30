/*
# IT PRO - Question paper library schema

1. New Tables
- `profiles`: one row per signed-in user (id, full_name, role). Role is `student` or `admin`.
- `colleges`: colleges with a category (Engineering, Arts & Science, Polytechnic, Other).
- `departments`: departments belonging to a college.
- `subjects`: subjects belonging to a department, with semester (1-8) and year level (1-4).
- `question_papers`: PDF question papers linked to a subject, with exam type, exam year, storage path and approval status.

2. Storage
- Private bucket `question-papers` (PDF only, 20 MB limit). Files are stored under `<user id>/<file>`.

3. Security
- RLS enabled on every table. Reference data (colleges, departments, subjects) is readable by signed-in users and only writable by admins.
- Students can only update their own full name. Their role cannot be changed from the app.
- Students can upload papers only as pending, and only see approved papers plus their own uploads. Admins approve, reject and delete.
- `is_admin()` is a SECURITY DEFINER helper that is not callable by anonymous users.
- The first account to register becomes the admin; later accounts are students.

4. Notes
- No existing data is modified or removed.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Engineering', 'Arts & Science', 'Polytechnic', 'Other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (college_id, name)
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL DEFAULT '',
  year_level int NOT NULL CHECK (year_level BETWEEN 1 AND 4),
  semester int NOT NULL CHECK (semester BETWEEN 1 AND 8),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_departments_college ON departments(college_id);
CREATE INDEX IF NOT EXISTS idx_subjects_department ON subjects(department_id);

CREATE TABLE IF NOT EXISTS question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  exam_type text NOT NULL CHECK (exam_type IN ('previous_year', 'semester', 'model')),
  exam_year int NOT NULL CHECK (exam_year BETWEEN 1990 AND 2100),
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0 CHECK (file_size >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_papers_subject ON question_papers(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_papers_uploader ON question_papers(uploaded_by);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN 'student' ELSE 'admin' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (full_name) ON profiles TO authenticated;
GRANT SELECT ON colleges, departments, subjects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON colleges, departments, subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON question_papers TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile_name" ON profiles;
CREATE POLICY "update_own_profile_name" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "select_colleges" ON colleges;
CREATE POLICY "select_colleges" ON colleges FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_colleges_admin" ON colleges;
CREATE POLICY "insert_colleges_admin" ON colleges FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_colleges_admin" ON colleges;
CREATE POLICY "update_colleges_admin" ON colleges FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_colleges_admin" ON colleges;
CREATE POLICY "delete_colleges_admin" ON colleges FOR DELETE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "select_departments" ON departments;
CREATE POLICY "select_departments" ON departments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_departments_admin" ON departments;
CREATE POLICY "insert_departments_admin" ON departments FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_departments_admin" ON departments;
CREATE POLICY "update_departments_admin" ON departments FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_departments_admin" ON departments;
CREATE POLICY "delete_departments_admin" ON departments FOR DELETE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "select_subjects" ON subjects;
CREATE POLICY "select_subjects" ON subjects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_subjects_admin" ON subjects;
CREATE POLICY "insert_subjects_admin" ON subjects FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_subjects_admin" ON subjects;
CREATE POLICY "update_subjects_admin" ON subjects FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_subjects_admin" ON subjects;
CREATE POLICY "delete_subjects_admin" ON subjects FOR DELETE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "select_papers_visible" ON question_papers;
CREATE POLICY "select_papers_visible" ON question_papers FOR SELECT
  TO authenticated USING (status = 'approved' OR uploaded_by = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "insert_own_pending_paper" ON question_papers;
CREATE POLICY "insert_own_pending_paper" ON question_papers FOR INSERT
  TO authenticated WITH CHECK (uploaded_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "update_papers_admin" ON question_papers;
CREATE POLICY "update_papers_admin" ON question_papers FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_papers_owner_pending_or_admin" ON question_papers;
CREATE POLICY "delete_papers_owner_pending_or_admin" ON question_papers FOR DELETE
  TO authenticated USING (is_admin() OR (uploaded_by = auth.uid() AND status = 'pending'));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('question-papers', 'question-papers', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = false, file_size_limit = 20971520, allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "upload_own_question_paper_files" ON storage.objects;
CREATE POLICY "upload_own_question_paper_files" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'question-papers' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "read_visible_question_paper_files" ON storage.objects;
CREATE POLICY "read_visible_question_paper_files" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'question-papers' AND (
      is_admin()
      OR EXISTS (
        SELECT 1 FROM public.question_papers p
        WHERE p.storage_path = storage.objects.name
          AND (p.status = 'approved' OR p.uploaded_by = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "delete_question_paper_files_admin" ON storage.objects;
CREATE POLICY "delete_question_paper_files_admin" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'question-papers' AND is_admin());
