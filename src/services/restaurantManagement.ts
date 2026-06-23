import api from '../utils/api';
import {formatApiErrorDetail} from '../utils/formatApiError';

const BASE = '/management';

// --- Dashboard / Stats ---
export interface DashboardStats {
  total_orders?: number;
  total_dishes?: number;
  total_revenue?: number;
  average_order_value?: number;
  pending_orders?: number;
  completed_orders?: number;
  today_revenue?: number;
  total_customers?: number;
  average_rating?: number;
  top_dishes?: { id: number; name: string; price: number; image_url?: string; orders: number; revenue: number }[];
  [key: string]: unknown;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>(`${BASE}/stats/dashboard`);
  return data ?? {};
}

// --- Commandes ---
export type OrderStatusRestaurant = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';

export interface RestaurantOrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  unit_price: number;
}

export interface RestaurantOrder {
  id: number;
  orderNumber: string;
  status: string;
  phone: string;
  address: string;
  email: string;
  paid: boolean;
  paid_amount: number;
  restaurant_total: number;
  total: number;
  items_count: number;
  items: RestaurantOrderItem[];
  customer: { name: string; phone: string; address: string; email: string };
  orderTime?: string;
  orderDate?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getRestaurantOrders(status?: string): Promise<RestaurantOrder[]> {
  const { data } = await api.get<RestaurantOrder[]>(`${BASE}/orders`, {
    params: status ? { status } : undefined,
  });
  return Array.isArray(data) ? data : [];
}

export async function getRestaurantOrderById(orderId: number): Promise<RestaurantOrder | null> {
  try {
    const { data } = await api.get<RestaurantOrder>(`${BASE}/orders/${orderId}`);
    return data;
  } catch (e: any) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export async function updateOrderStatus(orderId: number, status: string): Promise<unknown> {
  const { data } = await api.put(`${BASE}/orders/${orderId}/status`, { status });
  return data;
}

// --- Menus & Plats ---
export interface ManagementDish {
  id: number;
  name: string;
  description?: string;
  price: number;
  dish_image_url?: string;
  category_id?: number;
  is_available?: boolean;
  restaurant_id?: number;
}

export interface MenuWithDishes {
  id: number;
  name: string;
  description?: string;
  restaurant_id: number;
  dishes: { id: number; name: string; description?: string; price: number; dish_image_url?: string }[];
}

export interface MenuRead {
  id: number;
  name: string;
  description?: string;
  restaurant_id: number;
}

export async function getRestaurantDishes(): Promise<ManagementDish[]> {
  const { data } = await api.get<ManagementDish[]>(`${BASE}/dishes`);
  return Array.isArray(data) ? data : [];
}

export async function getMenusWithDishes(): Promise<MenuWithDishes[]> {
  const { data } = await api.get<MenuWithDishes[]>(`${BASE}/menus-with-dishes`);
  return Array.isArray(data) ? data : [];
}

export async function getRestaurantMenus(): Promise<MenuRead[]> {
  const { data } = await api.get<MenuRead[]>(`${BASE}/menus`);
  return Array.isArray(data) ? data : [];
}

export interface DishCreatePayload {
  name: string;
  description?: string;
  price: number;
  dish_image_url: string;
  category_id?: number;
  diet_type?: string;
  is_available?: boolean;
}

export interface MenuCreatePayload {
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
}

export async function createDish(payload: DishCreatePayload): Promise<ManagementDish> {
  const { data } = await api.post<ManagementDish>(`${BASE}/dishes`, {
    name: payload.name,
    description: payload.description ?? '',
    price: payload.price,
    dish_image_url: payload.dish_image_url,
    category_id: payload.category_id ?? null,
    diet_type: payload.diet_type ?? 'none',
    is_available: payload.is_available ?? true,
  });
  return data;
}

export async function updateDish(dishId: number, payload: Partial<DishCreatePayload>): Promise<ManagementDish> {
  const { data } = await api.put<ManagementDish>(`${BASE}/dishes/${dishId}`, {
    name: payload.name ?? '',
    description: payload.description ?? '',
    price: payload.price ?? 0,
    dish_image_url: payload.dish_image_url ?? '',
    category_id: payload.category_id ?? null,
    diet_type: payload.diet_type ?? 'none',
    is_available: payload.is_available ?? true,
  });
  return data;
}

export async function createMenu(payload: MenuCreatePayload): Promise<MenuRead> {
  const { data } = await api.post<MenuRead>(`${BASE}/menus`, {
    name: payload.name,
    description: payload.description ?? null,
    price: payload.price ?? null,
    image_url: payload.image_url ?? null,
  });
  return data;
}

export async function addDishesToMenu(menuId: number, dishIds: number[]): Promise<{ added_dishes: unknown[] }> {
  const { data } = await api.post<{ added_dishes: unknown[] }>(`${BASE}/menus/${menuId}/dishes/add`, {
    dish_ids: dishIds,
  });
  return data;
}

export async function deleteDish(dishId: number): Promise<void> {
  await api.delete(`${BASE}/dishes/${dishId}`);
}

export async function deleteMenu(menuId: number): Promise<void> {
  await api.delete(`${BASE}/menus/${menuId}`);
}

// --- Analytics ---
export interface RestaurantAnalytics {
  todayOrders?: number;
  ordersChange?: string;
  todayRevenue?: number;
  revenueChange?: string;
  uniqueCustomers?: number;
  customersChange?: string;
  averageOrder?: number;
  averageOrderChange?: string;
  hourlyActivity?: unknown[];
  popularDishes?: unknown[];
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface OrdersDataPoint {
  date: string;
  orders: number;
}

/** Normalise la réponse analytics (API peut renvoyer camelCase ou snake_case) */
function normalizeAnalytics(raw: Record<string, unknown> | null | undefined): RestaurantAnalytics {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  return {
    todayOrders: (r.todayOrders ?? r.today_orders) != null ? Number(r.todayOrders ?? r.today_orders) : undefined,
    ordersChange: (r.ordersChange ?? r.orders_change) as string | undefined,
    todayRevenue: (r.todayRevenue ?? r.today_revenue) != null ? Number(r.todayRevenue ?? r.today_revenue) : undefined,
    revenueChange: (r.revenueChange ?? r.revenue_change) as string | undefined,
    uniqueCustomers: (r.uniqueCustomers ?? r.unique_customers) != null ? Number(r.uniqueCustomers ?? r.unique_customers) : undefined,
    customersChange: (r.customersChange ?? r.customers_change) as string | undefined,
    averageOrder: (r.averageOrder ?? r.average_order) != null ? Number(r.averageOrder ?? r.average_order) : undefined,
    averageOrderChange: (r.averageOrderChange ?? r.average_order_change) as string | undefined,
    hourlyActivity: (r.hourlyActivity ?? r.hourly_activity) as unknown[] | undefined,
    popularDishes: (r.popularDishes ?? r.popular_dishes) as unknown[] | undefined,
  };
}

export async function getRestaurantAnalytics(): Promise<RestaurantAnalytics> {
  const { data } = await api.get<Record<string, unknown>>(`${BASE}/analytics`);
  return normalizeAnalytics(data ?? {});
}

export async function getRevenueAnalytics(period: string = '7d'): Promise<RevenueDataPoint[]> {
  const { data } = await api.get<RevenueDataPoint[]>(`${BASE}/analytics/revenue`, {
    params: { period },
  });
  return Array.isArray(data) ? data : [];
}

export async function getOrdersAnalytics(period: string = '7d'): Promise<OrdersDataPoint[]> {
  const { data } = await api.get<OrdersDataPoint[]>(`${BASE}/analytics/orders`, {
    params: { period },
  });
  return Array.isArray(data) ? data : [];
}

// --- Profil restaurant ---
export interface RestaurantProfileRead {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  cuisine_type?: string;
  delivery_fee?: number;
  minimum_order?: number;
  rating?: number;
  is_active?: boolean;
  bio?: string;
  website_url?: string;
  facebook_link?: string;
  instagram_link?: string;
  banner_image_url?: string;
  logo_url?: string;
  delivery_available?: boolean;
  takeaway_available?: boolean;
  dine_in_available?: boolean;
  opening_hours?: string;
}

export interface RestaurantProfileUpdatePayload {
  name?: string;
  description?: string;
  phone?: string;
  address?: string;
  email?: string;
  cuisine_type?: string;
  delivery_fee?: number;
  minimum_order?: number;
  bio?: string;
  opening_hours?: string;
  website_url?: string;
  facebook_link?: string;
  instagram_link?: string;
  banner_image_url?: string;
  logo_url?: string;
  delivery_available?: boolean;
}

export async function getRestaurantProfile(): Promise<RestaurantProfileRead | null> {
  try {
    const { data } = await api.get<RestaurantProfileRead>(`${BASE}/profile`);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function updateRestaurantProfile(
  payload: RestaurantProfileUpdatePayload,
): Promise<RestaurantProfileRead | null> {
  try {
    const { data } = await api.put<RestaurantProfileRead>(`${BASE}/profile`, payload);
    return data ?? null;
  } catch {
    return null;
  }
}

// --- Avis (reviews) ---
export interface ManagementReview {
  id: number;
  rating?: number;
  score?: number;
  comment?: string;
  comment_text?: string;
  client_name?: string;
  user_name?: string;
  reply?: string;
  created_at?: string;
  [key: string]: unknown;
}

export async function getManagementReviews(): Promise<ManagementReview[]> {
  const { data } = await api.get<ManagementReview[]>(`${BASE}/reviews`);
  return Array.isArray(data) ? data : [];
}

export interface ManagementAnnouncement {
  id: number;
  title: string;
  content: string;
  type?: string;
  priority?: string;
  is_urgent?: boolean;
  created_at?: string;
  expires_at?: string;
}

export async function getManagementAnnouncements(): Promise<ManagementAnnouncement[]> {
  try {
    const { data } = await api.get<ManagementAnnouncement[]>(`${BASE}/announcements`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// --- Suppléments (management) ---
export interface ManagementSupplement {
  id: number;
  name: string;
  price: number;
  dish_id: number;
}

export async function getManagementSupplements(): Promise<ManagementSupplement[]> {
  const { data } = await api.get<ManagementSupplement[]>(`${BASE}/supplements`);
  return Array.isArray(data) ? data : [];
}

export interface CreateSupplementPayload {
  name: string;
  price: number;
  dish_id: number;
}

export async function createManagementSupplement(
  payload: CreateSupplementPayload,
): Promise<ManagementSupplement> {
  const { data } = await api.post<ManagementSupplement>(`${BASE}/supplements`, payload);
  return data!;
}

// --- Services traiteur (management) ---
export interface ManagementCateringService {
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
  cancellation_policy?: string;
  is_active?: boolean;
  featured?: boolean;
  rating?: number;
  review_count?: number;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CateringServiceCreatePayload {
  service_name: string;
  service_description?: string;
  service_type?: string;
  base_price: number;
  price_per_person?: number;
  currency?: string;
  min_guests: number;
  max_guests?: number;
  delivery_available?: boolean;
  setup_available?: boolean;
  staff_available?: boolean;
  equipment_rental?: boolean;
  cancellation_policy?: string;
  is_active?: boolean;
  featured?: boolean;
  image_url?: string | null;
}

export type CateringServiceUpdatePayload = Partial<CateringServiceCreatePayload>;

export async function getManagementCateringServices(): Promise<ManagementCateringService[]> {
  const { data } = await api.get<ManagementCateringService[]>(`${BASE}/catering-services`);
  return Array.isArray(data) ? data : [];
}

export async function createManagementCateringService(
  payload: CateringServiceCreatePayload,
): Promise<ManagementCateringService> {
  const { data } = await api.post<ManagementCateringService>(`${BASE}/catering-services`, {
    ...payload,
    currency: payload.currency ?? 'EUR',
    delivery_available: payload.delivery_available ?? false,
    setup_available: payload.setup_available ?? false,
    staff_available: payload.staff_available ?? false,
    equipment_rental: payload.equipment_rental ?? false,
    is_active: payload.is_active ?? true,
    featured: payload.featured ?? false,
  });
  return data!;
}

export async function updateManagementCateringService(
  serviceId: number,
  payload: CateringServiceUpdatePayload,
): Promise<ManagementCateringService> {
  const { data } = await api.put<ManagementCateringService>(
    `${BASE}/catering-services/${serviceId}`,
    payload,
  );
  return data!;
}

export async function deleteManagementCateringService(serviceId: number): Promise<void> {
  await api.delete(`${BASE}/catering-services/${serviceId}`);
}

// --- Réservations traiteur (catering bookings) ---
export interface CateringBookingItem {
  id: number;
  restaurant_id: number;
  service_id?: number;
  package_id?: number;
  event_date: string;
  event_time: string;
  guest_count: number;
  total_amount: number;
  currency: string;
  status: string;
  payment_status?: string;
  contact_email?: string;
  contact_phone?: string;
  delivery_address?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export async function getCateringBookings(statusFilter?: string | null): Promise<CateringBookingItem[]> {
  const params =
    statusFilter && statusFilter !== 'all' ? { status_filter: statusFilter } : undefined;
  const { data } = await api.get<CateringBookingItem[]>('/catering/bookings', { params });
  return Array.isArray(data) ? data : [];
}

// --- Promotions (management) ---
export interface ManagementPromotion {
  id: number;
  title: string;
  description?: string;
  promotion_type?: string;
  discount_percentage?: number;
  original_price?: number;
  final_price?: number;
  discounted_price?: number;
  status: string;
  start_date?: string;
  end_date?: string;
  is_featured?: boolean;
  admin_validated?: boolean;
  current_uses?: number;
  max_uses?: number;
  remaining_uses?: number;
  image_url?: string;
  video_url?: string;
  display_format?: string;
  discount_display?: string;
  final_price_display?: string;
  [key: string]: unknown;
}

export interface PromotionCreatePayload {
  title: string;
  description?: string;
  promotion_type?: string;
  original_price: number;
  discount_percentage?: number;
  fixed_discount_amount?: number;
  start_date?: string;
  end_date?: string;
  max_uses?: number;
  is_featured?: boolean;
  display_format?: string;
  media_type?: string;
  media_url?: string;
  cta_label?: string;
  cta_url?: string;
  dish_ids?: number[];
  menu_ids?: number[];
  requires_payment?: boolean;
  [key: string]: unknown;
}

export type PromotionUpdatePayload = Partial<PromotionCreatePayload>;

export async function getManagementPromotions(params?: {
  status?: string;
  promotion_type?: string;
  search?: string;
}): Promise<ManagementPromotion[]> {
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.promotion_type) query.promotion_type = params.promotion_type;
  if (params?.search) query.search = params.search;
  const {data} = await api.get<ManagementPromotion[]>(`${BASE}/promotions`, {
    params: Object.keys(query).length ? query : undefined,
  });
  return Array.isArray(data) ? data : [];
}

export async function createManagementPromotion(
  payload: PromotionCreatePayload,
): Promise<ManagementPromotion> {
  const {data} = await api.post<ManagementPromotion>(`${BASE}/promotions`, payload);
  return data!;
}

export async function updateManagementPromotion(
  promotionId: number,
  payload: PromotionUpdatePayload,
): Promise<ManagementPromotion> {
  const {data} = await api.put<ManagementPromotion>(`${BASE}/promotions/${promotionId}`, payload);
  return data!;
}

export async function deleteManagementPromotion(promotionId: number): Promise<void> {
  await api.delete(`${BASE}/promotions/${promotionId}`);
}

export interface PromotionStats {
  total_promotions?: number;
  active_promotions?: number;
  total_uses?: number;
  total_revenue?: number;
  [key: string]: unknown;
}

export async function getManagementPromotionStats(): Promise<PromotionStats> {
  const {data} = await api.get<PromotionStats>(`${BASE}/promotions/stats`);
  return data ?? {};
}

// --- Upload image (React Native: uri + name + type) ---
export async function uploadManagementImage(
  fileUri: string,
  fileName: string,
  mimeType: string,
  folder: string = 'dishes',
): Promise<{ image_url: string }> {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName || 'image.jpg',
    type: mimeType || 'image/jpeg',
  } as any);
  const { data } = await api.post<{ success?: boolean; image_url: string }>(
    `${BASE}/upload/image?folder=${encodeURIComponent(folder)}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return { image_url: data?.image_url ?? '' };
}

/** Upload depuis un File (web) : envoie vers le CDN via l’API management. */
export async function uploadManagementImageFile(
  file: File,
  folder: string = 'dishes',
): Promise<{ image_url: string }> {
  const toCompressedFile = async (input: File): Promise<File> => {
    try {
      // Compression uniquement en environnement web avec Canvas.
      if (typeof window === 'undefined' || typeof document === 'undefined') return input;
      if (!input.type?.startsWith('image/')) return input;

      const maxDimension = 1600; // limite taille image
      const targetType = 'image/jpeg';
      const quality = 0.82;

      const objectUrl = URL.createObjectURL(input);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = objectUrl;
      });

      const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return input;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), targetType, quality),
      );
      URL.revokeObjectURL(objectUrl);

      if (!blob) return input;
      // Si compression non avantageuse, garder l'original.
      if (blob.size >= input.size) return input;

      const baseName = input.name?.replace(/\.[^.]+$/, '') || 'upload';
      return new File([blob], `${baseName}.jpg`, {
        type: targetType,
        lastModified: Date.now(),
      });
    } catch {
      return input;
    }
  };

  const fileToUpload = await toCompressedFile(file);
  const formData = new FormData();
  formData.append('file', fileToUpload);
  const { data } = await api.post<{ success?: boolean; image_url: string }>(
    `${BASE}/upload/image?folder=${encodeURIComponent(folder)}`,
    formData,
  );
  return { image_url: data?.image_url ?? '' };
}

// --- Wallet & Payout ---
export interface WalletInfo {
  balance?: number;
  available_balance?: number;
  pending_balance?: number;
  transactions?: { id: number; amount: number; type: string; description?: string; created_at?: string }[];
  wallet_id?: number;
}

export async function getWalletInfo(): Promise<WalletInfo> {
  const { data } = await api.get<WalletInfo>(`${BASE}/wallet`);
  return data ?? { balance: 0, available_balance: 0, pending_balance: 0, transactions: [] };
}

export interface PayoutResult {
  success: boolean;
  transfer_id?: string;
  payout_id?: string;
  amount?: number;
  new_balance?: number;
  arrival_date?: number;
}

export interface StripeConnectStatus {
  id?: number;
  restaurant_id?: number;
  status?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

export interface StripeConnectBalance {
  success?: boolean;
  available_balance?: number;
  pending_balance?: number;
  total_balance?: number;
}

export interface StripeConnectPayout {
  id?: number;
  stripe_payout_id?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  arrival_date?: string;
}

async function getCurrentRestaurantId(): Promise<number> {
  const profile = await getRestaurantProfile();
  const restaurantId = profile?.id;
  if (!restaurantId) {
    throw new Error('Restaurant introuvable');
  }
  return restaurantId;
}

export async function getStripeConnectStatus(): Promise<StripeConnectStatus | null> {
  try {
    const restaurantId = await getCurrentRestaurantId();
    const { data } = await api.get<StripeConnectStatus>(
      `/stripe-connect/accounts/${restaurantId}/status`,
      { silentError: true } as any,
    );
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getStripeConnectBalance(): Promise<StripeConnectBalance | null> {
  try {
    const restaurantId = await getCurrentRestaurantId();
    const { data } = await api.get<StripeConnectBalance>(
      `/stripe-connect/balance/${restaurantId}`,
      { silentError: true } as any,
    );
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getStripeConnectPayouts(limit: number = 20): Promise<StripeConnectPayout[]> {
  try {
    const restaurantId = await getCurrentRestaurantId();
    const { data } = await api.get<StripeConnectPayout[]>(`/stripe-connect/payouts/${restaurantId}`, {
      params: { limit },
      silentError: true,
    });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createStripeConnectOnboardingLink(): Promise<{ url?: string; expires_at?: number } | null> {
  try {
    const restaurantId = await getCurrentRestaurantId();
    const refreshUrl = 'afrodine://restaurant/dashboard?connect=refresh';
    const returnUrl = 'afrodine://restaurant/dashboard?connect=done';
    try {
      await api.post('/stripe-connect/accounts', { restaurant_id: restaurantId });
    } catch (createErr: any) {
      const msg = formatApiErrorDetail(createErr?.response?.data?.detail);
      if (!msg.toLowerCase().includes('already exists')) {
        throw createErr;
      }
    }
    const { data } = await api.post(`/stripe-connect/accounts/${restaurantId}/link`, {
      restaurant_id: restaurantId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });
    return data ?? null;
  } catch {
    return null;
  }
}

export async function requestPayout(
  amount: number,
  description: string = 'Retrait manuel',
): Promise<PayoutResult> {
  try {
    const restaurantId = await getCurrentRestaurantId();
    const { data } = await api.post<PayoutResult>(`/stripe-connect/withdraw/${restaurantId}`, {
      amount,
      reason: description,
    });
    return data ?? { success: false };
  } catch {
    return { success: false };
  }
}
