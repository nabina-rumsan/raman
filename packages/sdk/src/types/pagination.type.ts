export type Pagination = {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
  year?: string;
  name?: string;
  status?: string
  user?: string;
  project?: string;
  category?: string;
};
