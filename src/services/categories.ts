import api from '../utils/api';

export interface CategoryApi {
  id: number;
  name: string;
}

export async function getCategories(): Promise<CategoryApi[]> {
  const {data} = await api.get<CategoryApi[]>('/categories/');
  return Array.isArray(data) ? data : [];
}
