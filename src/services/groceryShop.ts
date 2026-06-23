import api from '../utils/api';

export type GroceryListItemSource = 'catalog' | 'dish';

export interface GroceryShopProductApi {
  id: number;
  grocery_shop_id?: number;
  /** catalogue plateforme vs plat menu tagué épicerie */
  source?: GroceryListItemSource;
  restaurant_id?: number;
  restaurant_name?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  origin_country?: string | null;
  origin_region?: string | null;
  is_african: boolean;
  price: number | string;
  stock_quantity: number;
  unit: string;
  image_url?: string | null;
  is_active?: boolean;
}

export async function getGroceryShopProducts(params?: {
  grocery_shop_id?: number;
  category?: string;
  is_african?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
  active_only?: boolean;
}): Promise<GroceryShopProductApi[]> {
  const {data} = await api.get<GroceryShopProductApi[]>('/grocery-shop-products/', {
    params: {
      grocery_shop_id: params?.grocery_shop_id,
      category: params?.category,
      is_african: params?.is_african,
      search: params?.search,
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 40,
      active_only: params?.active_only ?? true,
    },
  });
  return Array.isArray(data) ? data : [];
}

/** Plats épicerie (menu) visibles marketplace */
export async function getPublicGroceryDishes(params?: {skip?: number; limit?: number}) {
  const {data} = await api.get<
    Array<{
      id: number;
      name: string;
      price: number;
      dish_image_url: string;
      restaurant_id: number;
      restaurant_name?: string | null;
      category_name?: string | null;
    }>
  >('/dishes/grocery/public', {
    params: {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 40,
    },
  });
  return Array.isArray(data) ? data : [];
}
