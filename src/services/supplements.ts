import api from '../utils/api';

export interface SupplementApi {
  id: number;
  name: string;
  price: number;
  dish_id: number;
}

/**
 * Récupère les suppléments disponibles pour un plat (depuis la base de données).
 */
export async function getSupplementsForDish(dishId: number): Promise<SupplementApi[]> {
  const {data} = await api.get<SupplementApi[]>(`/supplements/dish/${dishId}`);
  return Array.isArray(data) ? data : [];
}
