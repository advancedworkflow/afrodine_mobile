import api from '../utils/api';

function toPositiveInt(value: number | string): number | null {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Image dans images_by_type */
export interface RestaurantImageByType {
  id?: number;
  image_url: string;
  sort_order?: number;
}

/** Profil restaurant (table restaurant_profiles + restaurant_images) : bannière, logo, slide, card, galerie */
export interface RestaurantProfileApi {
  id?: number;
  banner_image_url?: string;
  logo_url?: string;
  slide_image_url?: string;
  card_image_url?: string;
  restaurant_image_url?: string;
  images_by_type?: Record<string, RestaurantImageByType[]>;
  website_url?: string;
  bio?: string;
  opening_hours?: string;
}

export interface RestaurantApi {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  cuisine_type?: string;
  rating?: number;
  delivery_fee?: number;
  minimum_order?: number;
  is_active?: boolean;
  // Certains endpoints renvoient ces URLs au niveau racine
  banner_image_url?: string;
  logo_url?: string;
  card_image_url?: string;
  restaurant_image_url?: string;
  images_by_type?: Record<string, RestaurantImageByType[]>;
  /** Données du profil (table restaurant_profiles), inclut l’URL de la bannière */
  profile?: RestaurantProfileApi;
  /** Programme fidélité (commandes chez ce restaurant) */
  loyalty_enabled?: boolean;
  loyalty_tranche_euros?: number;
  loyalty_points_per_tranche?: number;
}

export interface RestaurantForList {
  id: string;
  name: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  deliveryTime?: string;
  deliveryFee?: string;
  imageUrl?: string;
  restaurantImageUrl?: string;
}

function toRestaurantForList(
  r: RestaurantApi,
  options?: {imageVariant?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'},
): RestaurantForList {
  const profile: any = r.profile ?? {};
  const root: any = r ?? {};
  const imagesByType: Record<string, RestaurantImageByType[]> =
    profile.images_by_type || root.images_by_type || {};

  const firstImageFromTypes = (types: string[]): string | undefined => {
    for (const type of types) {
      const arr = imagesByType[type];
      if (Array.isArray(arr) && arr.length > 0) {
        const first = arr[0]?.image_url;
        if (typeof first === 'string' && first.trim().length > 0) return first;
      }
    }
    return undefined;
  };

  // Image principale carte : restaurant > card > fallback images_by_type
  const baseRestaurantImageUrl =
    profile.restaurant_image_url ||
    profile.card_image_url ||
    root.restaurant_image_url ||
    root.card_image_url ||
    // Fallback explicite vers bannière si aucune image "restaurant/card"
    profile.banner_image_url ||
    root.banner_image_url ||
    firstImageFromTypes(['restaurant', 'card', 'banner', 'slide']) ||
    undefined;

  // Image secondaire : bannière > logo (profil/racine) > fallback table images
  const baseImageUrl =
    profile.banner_image_url ||
    root.banner_image_url ||
    profile.logo_url ||
    root.logo_url ||
    firstImageFromTypes(['banner', 'slide', 'logo']) ||
    baseRestaurantImageUrl ||
    undefined;
  const pickVariant = (url?: string) => {
    if (!url) return undefined;
    const variant = options?.imageVariant || 'large';
    if (!/_original\.(webp|jpg|jpeg)(\?.*)?$/i.test(url)) return url;
    return url.replace(/_original\.(webp|jpg|jpeg)(\?.*)?$/i, `_${variant}.webp$2`);
  };
  const imageUrl = pickVariant(baseImageUrl) || baseImageUrl;
  const restaurantImageUrl = pickVariant(baseRestaurantImageUrl) || baseRestaurantImageUrl;
  const finalRestaurantImageUrl = restaurantImageUrl || imageUrl;
  const finalImageUrl = imageUrl || restaurantImageUrl;
  const priceRange =
    r.minimum_order != null
      ? r.minimum_order >= 20
        ? '€€€'
        : r.minimum_order >= 10
          ? '€€'
          : '€'
      : '€€';
  return {
    id: String(r.id),
    name: r.name,
    cuisine: r.cuisine_type || undefined,
    priceRange,
    rating: r.rating ?? undefined,
    deliveryTime: '—',
    deliveryFee:
      r.delivery_fee != null
        ? r.delivery_fee === 0
          ? 'Gratuit'
          : `${r.delivery_fee.toFixed(1)}€`
        : undefined,
    imageUrl: finalImageUrl || undefined,
    restaurantImageUrl: finalRestaurantImageUrl || undefined,
  };
}

async function enrichMissingRestaurantImages(
  baseList: RestaurantForList[],
  options?: {imageVariant?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'},
): Promise<RestaurantForList[]> {
  const missing = baseList.filter(item => !item.imageUrl && !item.restaurantImageUrl);
  if (missing.length === 0) return baseList;

  const byId = new Map(baseList.map(item => [item.id, item]));
  await Promise.all(
    missing.slice(0, 16).map(async item => {
      try {
        const full = await getRestaurantById(item.id);
        if (!full) return;
        const enriched = toRestaurantForList(full, options);
        const current = byId.get(item.id);
        if (!current) return;
        byId.set(item.id, {
          ...current,
          imageUrl: enriched.imageUrl ?? current.imageUrl,
          restaurantImageUrl: enriched.restaurantImageUrl ?? current.restaurantImageUrl,
        });
      } catch {
        // no-op: on garde la carte sans image si le détail échoue
      }
    }),
  );

  return baseList.map(item => byId.get(item.id) ?? item);
}

export interface FilterOptionsApi {
  cities: string[];
  cuisine_types: string[];
  diet_types: string[];
  price_ranges: {min: number; max: number | null; label: string; value: string}[];
  delivery_ranges?: {min: number; max: number; label: string; value: string}[];
  rating_options?: {min: number; label: string; value: string}[];
}

export async function getFilterOptions(): Promise<FilterOptionsApi> {
  const {data} = await api.get<FilterOptionsApi>('/restaurants/filters/options');
  return (
    data || {
      cities: [],
      cuisine_types: [],
      diet_types: [],
      price_ranges: [],
    }
  );
}

export interface RestaurantFilters {
  city?: string;
  cuisine_type?: string;
  min_rating?: number;
  max_delivery_fee?: number;
}

export async function getRestaurants(params?: {
  limit?: number;
  skip?: number;
  city?: string;
  cuisine_type?: string;
  min_rating?: number;
  max_delivery_fee?: number;
  imageVariant?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
}): Promise<RestaurantForList[]> {
  const {data} = await api.get<RestaurantApi[]>('/restaurants/', {
    params: {limit: params?.limit ?? 20, skip: params?.skip ?? 0, ...params},
  });
  const list = Array.isArray(data) ? data : [];
  const mapped = list.map(item => toRestaurantForList(item, {imageVariant: params?.imageVariant || 'small'}));
  return enrichMissingRestaurantImages(mapped, {imageVariant: params?.imageVariant || 'small'});
}

export async function getNearbyRestaurants(params?: {
  limit?: number;
  skip?: number;
  city?: string;
  imageVariant?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
}): Promise<RestaurantForList[]> {
  let rawCity = (params?.city ?? '').trim();
  if (rawCity === 'undefined' || rawCity === 'null' || rawCity === '[object Object]') {
    rawCity = '';
  }
  const parsedCity = Number(rawCity);
  const hasCityId =
    rawCity.length > 0 &&
    Number.isInteger(parsedCity) &&
    parsedCity > 0 &&
    String(parsedCity) === rawCity;
  const queryParams: {limit: number; skip: number; city?: number} = {
    limit: params?.limit ?? 6,
    skip: params?.skip ?? 0,
  };
  // Le backend attend un entier (ID de ville), pas un libelle libre.
  if (hasCityId) queryParams.city = parsedCity;

  try {
    const {data} = await api.get<RestaurantApi[]>('/restaurants/nearby', {
      params: queryParams,
    });
    const list = Array.isArray(data) ? data : [];
    const mapped = list.map(item => toRestaurantForList(item, {imageVariant: params?.imageVariant}));
    return enrichMissingRestaurantImages(mapped, {imageVariant: params?.imageVariant});
  } catch (e: any) {
    // Compat backend: certains routers font matcher /nearby sur /{restaurant_id} => 422 int_parsing.
    const detail = e?.response?.data?.detail;
    const isNearbyRouteConflict =
      Array.isArray(detail) &&
      detail.some(
        (d: any) =>
          d?.type === 'int_parsing' &&
          Array.isArray(d?.loc) &&
          d.loc[0] === 'path' &&
          d.loc[1] === 'restaurant_id' &&
          d?.input === 'nearby',
      );
    if (!isNearbyRouteConflict) throw e;

    const {data} = await api.get<RestaurantApi[]>('/restaurants/', {
      params: {limit: queryParams.limit, skip: queryParams.skip},
    });
    const list = Array.isArray(data) ? data : [];
    const mapped = list.map(item => toRestaurantForList(item, {imageVariant: params?.imageVariant}));
    return enrichMissingRestaurantImages(mapped, {imageVariant: params?.imageVariant});
  }
}

export async function searchRestaurants(q: string): Promise<RestaurantForList[]> {
  const {data} = await api.get<RestaurantApi[]>('/restaurants/search', {
    params: {q},
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(item => toRestaurantForList(item, {imageVariant: 'small'}));
}

export async function getRestaurantById(
  restaurantId: number | string,
): Promise<RestaurantApi | null> {
  const id = toPositiveInt(restaurantId);
  if (id == null) return null;
  try {
    const {data} = await api.get<RestaurantApi>(
      `/restaurants/public/${id}`,
    );
    return data;
  } catch (e: any) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export interface DishFromRestaurantApi {
  id: number;
  name: string;
  description?: string;
  price: number;
  dish_image_url?: string;
  image_url?: string;
  image?: string;
  category_id?: number;
  restaurant_id?: number;
  category?: {id: number; name: string};
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
  categoryId?: number;
  categoryName?: string;
}

function toDishForList(d: DishFromRestaurantApi, restaurantId?: string): DishForList {
  const imageUrl =
    d.dish_image_url ||
    (d as any).image_url ||
    (d as any).image ||
    undefined;
  return {
    id: String(d.id),
    name: d.name,
    description: d.description ?? undefined,
    price: d.price,
    rating: undefined,
    deliveryTime: undefined,
    imageUrl,
    isFavorite: false,
    restaurantId: restaurantId ? String(restaurantId) : undefined,
    categoryId: d.category_id ?? d.category?.id,
    categoryName: d.category?.name ?? undefined,
  };
}

export async function getRestaurantDishes(
  restaurantId: number | string,
): Promise<DishForList[]> {
  const id = toPositiveInt(restaurantId);
  if (id == null) return [];
  const {data} = await api.get<DishFromRestaurantApi[]>(
    `/restaurants/${id}/dishes`,
  );
  const list = Array.isArray(data) ? data : [];
  return list.map(d => toDishForList(d, String(id)));
}

/** Plat tel que retourné dans menus-with-dishes */
export interface DishInMenuApi {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: {id: number | null; name: string | null};
}

/** Menu avec plats (API menus-with-dishes) */
export interface MenuWithDishesApi {
  id: number;
  name: string;
  description?: string;
  price?: number | null;
  image_url?: string | null;
  dishes: DishInMenuApi[];
}

export async function getRestaurantMenusWithDishes(
  restaurantId: number | string,
): Promise<MenuWithDishesApi[]> {
  const id = toPositiveInt(restaurantId);
  if (id == null) return [];
  const {data} = await api.get<MenuWithDishesApi[]>(
    `/restaurants/${id}/menus-with-dishes`,
  );
  return Array.isArray(data) ? data : [];
}

// --- Avis (reviews) ---
export interface RestaurantReviewApi {
  id: number;
  user_id: number;
  restaurant_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at?: string;
}

export async function getRestaurantReviews(
  restaurantId: number | string,
  params?: {limit?: number; offset?: number},
): Promise<RestaurantReviewApi[]> {
  const id = toPositiveInt(restaurantId);
  if (id == null) return [];
  try {
    const {data} = await api.get<RestaurantReviewApi[]>(
      `/restaurants/${id}/reviews`,
      {params: {limit: params?.limit ?? 20, offset: params?.offset ?? 0}},
    );
    return Array.isArray(data) ? data : [];
  } catch (e: any) {
    if (e.response?.status === 404) return [];
    throw e;
  }
}

export async function createRestaurantReview(
  restaurantId: number | string,
  payload: {rating: number; comment?: string},
): Promise<RestaurantReviewApi> {
  const id = toPositiveInt(restaurantId);
  if (id == null) {
    throw new Error('Restaurant invalide');
  }
  const {data} = await api.post<RestaurantReviewApi>(`/restaurants/${id}/reviews`, {
    rating: payload.rating,
    comment: payload.comment ?? '',
    restaurant_id: id,
  });
  return data;
}
