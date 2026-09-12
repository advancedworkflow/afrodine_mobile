import api from '../utils/api';
import {getAbsoluteImageUrl} from '../utils/api';

export interface MenuApi {
  id: number;
  name: string;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  restaurant_id?: number | null;
}

export async function getMenuById(menuId: number): Promise<MenuApi> {
  const {data} = await api.get<MenuApi>(`/menus/${menuId}`);
  return {
    ...data,
    image_url: getAbsoluteImageUrl(data.image_url) ?? data.image_url,
  };
}

export async function getMenus(): Promise<MenuApi[]> {
  const {data} = await api.get<MenuApi[]>('/menus/');
  const list = Array.isArray(data) ? data : [];
  return list.map(m => ({
    ...m,
    image_url: getAbsoluteImageUrl(m.image_url) ?? m.image_url,
  }));
}
