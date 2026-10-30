/*
# Let editors publish question papers directly

1. Purpose
- Editors (admin role) can publish a paper straight into the library instead of sending it to a pending queue.

2. Modified table
- `question_papers`: new INSERT policy for editors. The paper must be recorded under the editor's own account.

3. Security
- Only signed-in editors can insert. Students and visitors still cannot insert papers.
- Existing policies are unchanged.

4. Notes
- No data is modified or removed.
*/

DROP POLICY IF EXISTS "insert_papers_admin" ON question_papers;
CREATE POLICY "insert_papers_admin" ON question_papers FOR INSERT
  TO authenticated WITH CHECK (is_admin() AND uploaded_by = auth.uid());
