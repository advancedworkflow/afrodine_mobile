import api from '../utils/api';
import type {RestaurantApi} from './restaurants';

export interface DishApi {
  id: number;
  name: string;
  description?: string;
  price: number;
  dish_image_url?: string;
  image_url?: string;
  image?: string;
  restaurant_id: number;
  category?: {id: number; name: string};
  restaurant?: {
    id: number;
    name: string;
    cuisine_type?: string;
    rating?: number;
  };
}

export interface DishForDetail {
  id: string;
  name: string;
  description?: string;
  price: number;
  rating?: number;
  deliveryTime?: string;
  imageUrl?: string;
  restaurantName?: string;
  restaurantId?: string;
  ingredients?: string[];
  allergens?: string[];
  calories?: number;
}

function toDishForDetail(d: DishApi): DishForDetail {
  const baseImageUrl =
    d.dish_image_url ||
    d.image_url ||
    d.image ||
    undefined;
  const imageUrl = baseImageUrl && /_original\.(webp|jpg|jpeg)(\?.*)?$/i.test(baseImageUrl)
    ? baseImageUrl.replace(/_original\.(webp|jpg|jpeg)(\?.*)?$/i, '_medium.webp$2')
    : baseImageUrl;
  return {
    id: String(d.id),
    name: d.name,
    description: d.description ?? undefined,
    price: d.price,
    rating: d.restaurant?.rating,
    deliveryTime: undefined,
    imageUrl,
    restaurantName: d.restaurant?.name,
    restaurantId: d.restaurant_id ? String(d.restaurant_id) : undefined,
  };
}

export async function getDishById(
  dishId: number | string,
): Promise<DishForDetail | null> {
  try {
    const {data} = await api.get<DishApi>(`/dishes/${dishId}`);
    return toDishForDetail(data);
  } catch (e: any) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export async function searchDishes(q: string): Promise<DishForDetail[]> {
  const {data} = await api.get<DishApi[]>('/dishes/search', {params: {q}});
  const list = Array.isArray(data) ? data : [];
  return list.map(toDishForDetail);
}

export interface DishForList {
  id: string;
  name: string;
  description?: string;
  price: number;
  rating?: number;
  deliveryTime?: string;
  imageUrl?: string;
  isFavorite?: boolean;
  restaurantId?: string;
}

function toDishForListFromApi(d: {
  id: number;
  name: string;
  description?: string;
  price: number;
  dish_image_url?: string;
  image_url?: string;
  image?: string;
  restaurant_id?: number;
}): DishForList {
  const baseImageUrl =
    (d as any).dish_image_url ||
    (d as any).image_url ||
    (d as any).image ||
    undefined;
  const imageUrl = baseImageUrl && /_original\.(webp|jpg|jpeg)(\?.*)?$/i.test(baseImageUrl)
    ? baseImageUrl.replace(/_original\.(webp|jpg|jpeg)(\?.*)?$/i, '_small.webp$2')
    : baseImageUrl;
  return {
    id: String(d.id),
    name: d.name,
    description: d.description ?? undefined,
    price: d.price,
    imageUrl,
    isFavorite: false,
    restaurantId: d.restaurant_id ? String(d.restaurant_id) : undefined,
  };
}

export async function getDishes(params?: {
  limit?: number;
  skip?: number;
}): Promise<DishForList[]> {
  const {data} = await api.get<any[]>('/dishes/', {
    params: {limit: params?.limit ?? 20, skip: params?.skip ?? 0, ...params},
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(toDishForListFromApi);
}
