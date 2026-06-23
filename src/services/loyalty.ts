import api from '../utils/api';

export interface LoyaltyAccountApi {
  id?: number;
  total_points?: number;
  available_points?: number;
  level?: string;
}

/**
 * Compte fidélité global (namke) — réservé aux utilisateurs connectés.
 */
export async function getLoyaltyAccount(): Promise<LoyaltyAccountApi | null> {
  try {
    const {data} = await api.get<LoyaltyAccountApi>('/loyalty/account');
    return data ?? null;
  } catch {
    return null;
  }
}
