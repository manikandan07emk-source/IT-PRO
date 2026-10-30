import { supabase } from '@/lib/supabase';
import type { College, Department, Subject } from '@/lib/types';

export type Catalog = {
  colleges: College[];
  departments: Department[];
  subjects: Subject[];
};

export async function fetchCatalog(): Promise<Catalog> {
  const [colleges, departments, subjects] = await Promise.all([
    supabase.from('colleges').select('id, name, category').order('name'),
    supabase.from('departments').select('id, college_id, name').order('name'),
    supabase
      .from('subjects')
      .select('id, department_id, name, code, year_level, semester')
      .order('name'),
  ]);

  const firstError = colleges.error ?? departments.error ?? subjects.error;
  if (firstError) throw new Error(firstError.message);

  return {
    colleges: (colleges.data ?? []) as College[],
    departments: (departments.data ?? []) as Department[],
    subjects: (subjects.data ?? []) as Subject[],
  };
}
