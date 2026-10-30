import { supabase } from '@/lib/supabase';
import type { CollegeCategory } from '@/lib/types';

const DUPLICATE_KEY_CODE = '23505';

function toCatalogError(error: { code?: string; message: string }): Error {
  return new Error(error.code === DUPLICATE_KEY_CODE ? 'That name already exists here.' : error.message);
}

export async function addCollege(name: string, category: CollegeCategory): Promise<void> {
  const { error } = await supabase.from('colleges').insert({ name, category });
  if (error) throw toCatalogError(error);
}

export async function addDepartment(collegeId: string, name: string): Promise<void> {
  const { error } = await supabase.from('departments').insert({ college_id: collegeId, name });
  if (error) throw toCatalogError(error);
}

export type NewSubjectInput = {
  departmentId: string;
  name: string;
  code: string;
  yearLevel: number;
  semester: number;
};

export async function addSubject(input: NewSubjectInput): Promise<void> {
  const { error } = await supabase.from('subjects').insert({
    department_id: input.departmentId,
    name: input.name,
    code: input.code,
    year_level: input.yearLevel,
    semester: input.semester,
  });
  if (error) throw toCatalogError(error);
}
