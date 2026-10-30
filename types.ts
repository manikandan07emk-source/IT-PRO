export type ExamType = 'previous_year' | 'semester' | 'model';

export type CollegeCategory = 'Engineering' | 'Arts & Science' | 'Polytechnic' | 'Other';

export type College = {
  id: string;
  name: string;
  category: CollegeCategory;
};

export type Department = {
  id: string;
  college_id: string;
  name: string;
};

export type Subject = {
  id: string;
  department_id: string;
  name: string;
  code: string;
  year_level: number;
  semester: number;
};

export type Paper = {
  id: string;
  subject_id: string;
  title: string;
  exam_type: ExamType;
  exam_year: number;
  storage_path: string;
  file_name: string;
  file_size: number;
  status: 'pending' | 'approved';
  uploaded_by: string | null;
  created_at: string;
};

export type ManagedPaper = Pick<
  Paper,
  'id' | 'title' | 'exam_type' | 'exam_year' | 'storage_path' | 'file_name' | 'file_size'
> & {
  subjects: { name: string; code: string } | null;
};

export type Profile = {
  id: string;
  full_name: string;
  role: 'student' | 'admin';
};
