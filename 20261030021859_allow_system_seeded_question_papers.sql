/*
# Allow question papers without an uploader

1. Purpose
- Lets sample papers be added by the system, which has no signed-in user to record as uploader.

2. Modified table
- `question_papers.uploaded_by`: no longer required. Existing rows keep their uploader.

3. Security
- No policy or grant changes. Visitors still see only approved papers.

4. Notes
- No data is modified or removed.
*/

ALTER TABLE question_papers ALTER COLUMN uploaded_by DROP NOT NULL;
