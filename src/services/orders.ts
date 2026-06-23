import api from '../utils/api';

function toPositiveInt(value: number | string): number | null {
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isInteger(n) && n > 0 ? n : null;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'paid'
  | 'payment_failed'
  | 'cancelled';

export interface OrderItemApi {
  id: number;
  order_id: number;
  dish_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplements?: unknown[];
}

export interface OrderApi {
  id: number;
  customer_id?: number;
  paid: boolean;
  status: string;
  address: string;
  phone: string;
  email?: string;
  created: string;
  updated: string;
  paid_at?: string;
  paid_amount?: number;
  paid_currency?: string;
  items: OrderItemApi[];
}

export interface OrderForList {
  id: string;
  date: string;
  restaurantName: string;
  total: number;
  status: OrderStatus;
  itemsCount: number;
}

const statusMap: Record<string, OrderStatus> = {
  pending: 'pending',
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready: 'ready',
  delivered: 'delivered',
  paid: 'paid',
  payment_failed: 'payment_failed',
  cancelled: 'cancelled',
};

function toOrderForList(o: OrderApi): OrderForList {
  const total = o.paid_amount ?? o.items?.reduce((sum, i) => sum + (i.total_price || 0), 0) ?? 0;
  const itemsCount = o.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) ?? 0;
  return {
    id: String(o.id),
    date: o.created,
    restaurantName: `Commande #${o.id}`,
    total: Number(total),
    status: statusMap[o.status] ?? 'pending',
    itemsCount,
  };
}

export async function getMyOrders(params?: {
  skip?: number;
  limit?: number;
  status?: OrderStatus;
  sort_by?: 'created' | 'updated' | 'paid_amount';
  sort_order?: 'asc' | 'desc';
}): Promise<OrderForList[]> {
  const {data} = await api.get<OrderApi[]>('/orders/my', {
    params: {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 50,
      status: params?.status,
      sort_by: params?.sort_by ?? 'created',
      sort_order: params?.sort_order ?? 'desc',
    },
  });
  const list = Array.isArray(data) ? data : [];
  return list.map(toOrderForList);
}

export async function getOrderById(orderId: number | string): Promise<OrderApi | null> {
  const id = toPositiveInt(orderId);
  if (id == null) return null;
  try {
    const {data} = await api.get<OrderApi>(`/orders/${id}`);
    return data;
  } catch (e: any) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export interface OrderItemCreatePayload {
  dish_id: number;
  quantity: number;
  supplements?: {supplement_id: number; quantity: number}[];
}

export interface OrderCreatePayload {
  address: string;
  phone: string;
  email?: string;
  items: OrderItemCreatePayload[];
}

export interface OrderWithStripeSecret {
  id: number;
  stripe_client_secret?: string;
  /** Même clé que GET /config/stripe-publishable-key — pour le SDK avant/après commande */
  stripe_publishable_key?: string;
  [key: string]: unknown;
}

function normalizeOrderPayload(payload: OrderCreatePayload): OrderCreatePayload {
  const address = String(payload.address ?? '').trim();
  const phone = String(payload.phone ?? '').trim();
  const email = payload.email ? String(payload.email).trim() : undefined;

  const items = (Array.isArray(payload.items) ? payload.items : [])
    .map((item) => {
      const dishId = Number(item?.dish_id);
      const quantity = Number(item?.quantity);
      const supplements = Array.isArray(item?.supplements)
        ? item.supplements
            .map((sup) => ({
              supplement_id: Number(sup?.supplement_id),
              quantity: Number(sup?.quantity) || 1,
            }))
            .filter(
              (sup) =>
                Number.isInteger(sup.supplement_id) &&
                sup.supplement_id > 0 &&
                Number.isInteger(sup.quantity) &&
                sup.quantity > 0,
            )
        : undefined;

      if (!Number.isInteger(dishId) || dishId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
        return null;
      }

      return {
        dish_id: dishId,
        quantity,
        supplements: supplements && supplements.length > 0 ? supplements : undefined,
      };
    })
    .filter((item): item is OrderItemCreatePayload => item !== null);

  if (!address) throw new Error("Adresse de livraison manquante.");
  if (!phone) throw new Error("Téléphone manquant.");
  if (items.length === 0) throw new Error("Panier invalide: aucun article valide.");

  return {
    address,
    phone,
    email: email || undefined,
    items,
  };
}

export async function createGuestOrder(payload: OrderCreatePayload): Promise<OrderWithStripeSecret> {
  const normalized = normalizeOrderPayload(payload);
  const {data} = await api.post<OrderWithStripeSecret>('/orders/guest', normalized);
  return data;
}

/** Créer une commande pour l'utilisateur connecté (enregistrée avec son user_id). Token requis. */
export async function createOrder(payload: OrderCreatePayload): Promise<OrderWithStripeSecret> {
  const normalized = normalizeOrderPayload(payload);
  const {data} = await api.post<OrderWithStripeSecret>('/orders', normalized);
  return data;
}
