import api from '../utils/api';
import type {RestaurantForList} from './restaurants';

function toPositiveInt(value: number | string): number | null {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

export interface FavorisApi {
  id: number;
  user_id: number;
  favorited_object_id: number;
  favorited_object_type: string;
  favorited_object?: RestaurantSummaryApi | null;
}

export interface RestaurantSummaryApi {
  id: number;
  name: string;
  address: string;
  city: string;
  description?: string;
  rating?: number;
  review_count?: number;
  price_range?: string;
  cuisine_type?: string;
  is_open?: boolean;
}

function toRestaurantForList(r: RestaurantSummaryApi): RestaurantForList {
  return {
    id: String(r.id),
    name: r.name,
    cuisine: r.cuisine_type ?? undefined,
    priceRange: r.price_range ?? '€€',
    rating: r.rating ?? undefined,
    deliveryTime: '—',
    deliveryFee: undefined,
    imageUrl: undefined,
  };
}

export async function getFavorites(): Promise<RestaurantForList[]> {
  const {data} = await api.get<FavorisApi[]>('/favoris/');
  const list = Array.isArray(data) ? data : [];
  const restaurants: RestaurantForList[] = [];
  for (const fav of list) {
    if (fav.favorited_object_type === 'restaurant' && fav.favorited_object) {
      const obj = fav.favorited_object as RestaurantSummaryApi;
      restaurants.push(toRestaurantForList(obj));
    }
  }
  return restaurants;
}

/** Toggle restaurant favorite (add or remove). Returns new state: true = is favorite, false = removed. */
export async function toggleRestaurantFavorite(restaurantId: number | string): Promise<boolean> {
  const id = toPositiveInt(restaurantId);
  if (id == null) return false;
  const {data} = await api.post<{message: string}>(`/restaurants/${id}/favorite`);
  const added = data?.message?.toLowerCase().includes('added') ?? false;
  return added;
}

export async function checkRestaurantFavorite(restaurantId: number | string): Promise<boolean> {
  const id = toPositiveInt(restaurantId);
  if (id == null) return false;
  const {data} = await api.get<{is_favorite: boolean}>(`/restaurants/${id}/is-favorite`);
  return data?.is_favorite ?? false;
}
