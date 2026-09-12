import api from '../utils/api';

const BASE = '/catering';

function toPositiveInt(value: number | string): number | null {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

export interface CateringServiceApi {
  id: number;
  restaurant_id: number;
  service_name: string;
  service_description?: string;
  service_type?: string;
  base_price: number;
  price_per_person?: number;
  currency: string;
  min_guests: number;
  max_guests?: number;
  delivery_available: boolean;
  setup_available?: boolean;
  staff_available?: boolean;
  equipment_rental?: boolean;
  rating?: number;
  review_count?: number;
  is_active?: boolean;
  featured?: boolean;
  /** Photo CDN de l’offre traiteur */
  image_url?: string | null;
  restaurant_name?: string;
  restaurant_logo_url?: string;
  restaurant_banner_url?: string;
}

export interface CateringServiceForList {
  id: string;
  name: string;
  description?: string;
  type?: string;
  basePrice: number;
  pricePerPerson?: number;
  minGuests: number;
  maxGuests?: number;
  restaurantId: string;
  restaurantName?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
}

function toCateringForList(s: CateringServiceApi): CateringServiceForList {
  return {
    id: String(s.id),
    name: s.service_name,
    description: s.service_description ?? undefined,
    type: s.service_type ?? undefined,
    basePrice: Number(s.base_price),
    pricePerPerson: s.price_per_person != null ? Number(s.price_per_person) : undefined,
    minGuests: s.min_guests ?? 1,
    maxGuests: s.max_guests != null ? s.max_guests : undefined,
    restaurantId: String(s.restaurant_id),
    restaurantName: s.restaurant_name ?? undefined,
    rating: s.rating != null ? Number(s.rating) : undefined,
    reviewCount: s.review_count ?? 0,
    imageUrl: s.image_url ?? s.restaurant_banner_url ?? s.restaurant_logo_url ?? undefined,
  };
}

export interface CateringBookingCreatePayload {
  service_id?: number;
  formula_id?: number;
  event_date: string;
  event_time: string;
  guest_count: number;
  customer_id?: number;
  contact_email: string;
  contact_phone?: string;
  special_requests?: string;
  selected_dishes?: string[];
}

export interface CateringFormulaMenuOption {
  key: string;
  category: 'entree' | 'plat' | 'dessert' | 'boisson' | string;
  name: string;
  description?: string;
  selectable: boolean;
}

export interface CateringFormulaApi {
  id: number;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  price_per_person: number;
  is_custom_price: boolean;
  min_guests: number;
  max_guests: number;
  includes?: string[];
  image_url?: string | null;
  is_featured: boolean;
  display_order: number;
  menu_options?: CateringFormulaMenuOption[];
  menu_choice_count?: number;
}

export interface CateringFormulaCookApi {
  id: number;
  name: string;
  city?: string;
  cuisine_type?: string;
  rating?: number;
  review_count: number;
  image_url?: string | null;
}

export async function getCateringFormulas(): Promise<CateringFormulaApi[]> {
  const {data} = await api.get<CateringFormulaApi[]>(`${BASE}/formulas`);
  return Array.isArray(data) ? data : [];
}

export async function getCateringFormulaBySlug(slug: string): Promise<CateringFormulaApi | null> {
  try {
    const {data} = await api.get<CateringFormulaApi>(`${BASE}/formulas/${slug}`);
    return data;
  } catch (e: any) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export async function getCateringFormulaCooks(slug: string): Promise<CateringFormulaCookApi[]> {
  try {
    const {data} = await api.get<CateringFormulaCookApi[]>(`${BASE}/formulas/${slug}/cooks`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createCateringBooking(payload: CateringBookingCreatePayload) {
  const {data} = await api.post(`${BASE}/bookings`, payload);
  return data;
}

export async function getCateringServices(params?: {
  restaurant_id?: number;
  limit?: number;
}): Promise<CateringServiceForList[]> {
  const { data } = await api.get<CateringServiceApi[]>(`${BASE}/services`, {
    params: params?.restaurant_id ? { restaurant_id: params.restaurant_id } : undefined,
  });
  const list = Array.isArray(data) ? data : [];
  const mapped = list.map(toCateringForList);
  if (params?.limit) {
    return mapped.slice(0, params.limit);
  }
  return mapped;
}

export async function getCateringServiceById(serviceId: number | string): Promise<CateringServiceApi | null> {
  const id = toPositiveInt(serviceId);
  if (id == null) return null;
  try {
    const { data } = await api.get<CateringServiceApi>(`${BASE}/services/${id}`);
    return data;
  } catch (e: any) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

/** Services traiteur d’un restaurant (détail page) — GET /catering/services/restaurant/:restaurantId */
export async function getCateringServicesByRestaurant(
  restaurantId: number | string,
): Promise<CateringServiceApi[]> {
  const id = toPositiveInt(restaurantId);
  if (id == null) return [];
  try {
    const { data } = await api.get<CateringServiceApi[]>(
      `${BASE}/services/restaurant/${id}`,
    );
    return Array.isArray(data) ? data : [];
  } catch (e: any) {
    if (e.response?.status === 404) return [];
    throw e;
  }
}

