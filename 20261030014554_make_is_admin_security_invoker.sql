/*
# Make is_admin() run with the caller's rights

1. Modified Functions
- `is_admin()` now runs as the calling user instead of as its owner.

2. Security
- It only reads the caller's own profile row, which the profile policy already allows, so no extra privileges are needed.
- Removes the warning that a privileged function was callable by signed-in users.

3. Notes
- No tables or data are changed.
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
