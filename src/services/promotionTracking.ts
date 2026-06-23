import AsyncStorage from '@react-native-async-storage/async-storage';
import {Dimensions, Platform} from 'react-native';
import api from '../utils/api';

const SESSION_KEY = 'promotion_session_id';
const CLICKED_KEY = 'promotion_clicked';

async function getSessionId(): Promise<string> {
  let id = await AsyncStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `msession_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function getClickedPromotions(): Promise<{promotion_id: number; display_format?: string; clicked_at: string}[]> {
  try {
    const raw = await AsyncStorage.getItem(CLICKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveClick(promotionId: number, displayFormat?: string): Promise<void> {
  try {
    const list = await getClickedPromotions();
    if (!list.find(p => p.promotion_id === promotionId)) {
      list.push({promotion_id: promotionId, display_format: displayFormat, clicked_at: new Date().toISOString()});
      await AsyncStorage.setItem(CLICKED_KEY, JSON.stringify(list));
    }
  } catch {}
}

interface TrackOptions {
  displayFormat?: string;
  orderId?: number;
  conversionValue?: number;
  metadata?: Record<string, unknown>;
}

export async function trackPromotionEvent(
  promotionId: number,
  eventType: 'impression' | 'click' | 'conversion',
  options: TrackOptions = {},
): Promise<void> {
  try {
    const session_id = await getSessionId();
    const {width, height} = Dimensions.get('screen');

    const payload = {
      event_type: eventType,
      session_id,
      display_format: options.displayFormat ?? null,
      order_id: options.orderId ?? null,
      conversion_value: options.conversionValue ?? null,
      metadata: {
        ...options.metadata,
        platform: Platform.OS,
        screen_width: width,
        screen_height: height,
        timestamp: new Date().toISOString(),
      },
    };

    await api.post(`/promotions/${promotionId}/track`, payload);
  } catch (e: any) {
    if (__DEV__) {
      console.warn('[promotionTracking] track failed:', e?.response?.status, e?.message);
    }
  }
}

export function trackImpression(promotionId: number, displayFormat?: string): Promise<void> {
  return trackPromotionEvent(promotionId, 'impression', {displayFormat});
}

export async function trackClick(promotionId: number, displayFormat?: string, metadata?: Record<string, unknown>): Promise<void> {
  await saveClick(promotionId, displayFormat);
  return trackPromotionEvent(promotionId, 'click', {
    displayFormat,
    metadata: {...metadata, click_timestamp: new Date().toISOString()},
  });
}

export function trackConversion(
  promotionId: number,
  orderId: number,
  conversionValue: number,
  displayFormat?: string,
): Promise<void> {
  return trackPromotionEvent(promotionId, 'conversion', {
    displayFormat,
    orderId,
    conversionValue,
    metadata: {conversion_timestamp: new Date().toISOString()},
  });
}

export async function getClickedPromotionIds(): Promise<number[]> {
  const list = await getClickedPromotions();
  return list.map(p => p.promotion_id);
}
