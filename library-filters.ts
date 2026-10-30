export type LibraryFilterValues = {
  collegeId: string;
  departmentId: string;
  year: string;
  semester: string;
  query: string;
};

export const EMPTY_FILTERS: LibraryFilterValues = {
  collegeId: '',
  departmentId: '',
  year: '',
  semester: '',
  query: '',
};
