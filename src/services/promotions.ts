import api from '../utils/api';
import {getAbsoluteImageUrl, getImageVariantUrl, getJpegFallbackUrl} from '../utils/api';

export interface PromotionApi {
  id: number;
  restaurant_id: number;
  title: string;
  description?: string;
  media_url?: string;
  original_price: number;
  discount_percentage?: number;
  fixed_discount_amount?: number;
  final_price?: number;
  cta_label?: string;
  cta_url?: string;
  display_format?: string;
  is_featured?: boolean;
}

export interface PromotionForList {
  id: number;
  restaurantId: number;
  title: string;
  subtitle: string;
  imageUrl?: string;
  buttonText: string;
  discountLabel?: string;
}

function toPromotionForList(p: PromotionApi): PromotionForList {
  const mediaCandidate = getImageVariantUrl(p.media_url, 'medium', 'webp') ?? getAbsoluteImageUrl(p.media_url);
  const safeImage = mediaCandidate ?? getJpegFallbackUrl(p.media_url);
  const discountLabel =
    p.discount_percentage != null && p.discount_percentage > 0
      ? `-${Math.round(p.discount_percentage)}%`
      : p.final_price != null && p.original_price > 0
        ? `-${(p.original_price - p.final_price).toFixed(0)}€`
        : undefined;
  return {
    id: p.id,
    restaurantId: p.restaurant_id,
    title: p.title,
    subtitle: p.description ?? (discountLabel ? `À partir de ${p.final_price?.toFixed(2) ?? ''}€` : 'Offre limitée'),
    imageUrl: safeImage ?? undefined,
    buttonText: p.cta_label ?? 'Découvrir',
    discountLabel,
  };
}

export async function getActivePromotions(params?: {
  restaurant_id?: number;
  display_format?: string;
  limit?: number;
}): Promise<PromotionForList[]> {
  try {
    const {data} = await api.get<PromotionApi[]>('/promotions/public/active', {
      params: {
        restaurant_id: params?.restaurant_id,
        display_format: params?.display_format,
        limit: params?.limit ?? 10,
      },
    });
    const list = Array.isArray(data) ? data : [];
    return list.map(toPromotionForList);
  } catch (e: any) {
    if (__DEV__ && e?.response) {
      console.warn('[promotions] getActivePromotions failed:', e.response?.status, e.response?.data?.detail ?? e.message);
    }
    return [];
  }
}
