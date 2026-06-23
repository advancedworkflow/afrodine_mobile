import api from '../utils/api';

const BASE = '/profiles';

export interface ClientProfileRead {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
}

export interface ClientProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  birth_date?: string | null;
  address?: string;
}

export async function getClientProfile(): Promise<ClientProfileRead | null> {
  try {
    const { data } = await api.get<ClientProfileRead>(`${BASE}/client`);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function updateClientProfile(
  payload: ClientProfileUpdatePayload,
): Promise<ClientProfileRead | null> {
  try {
    const { data } = await api.put<ClientProfileRead>(`${BASE}/client`, payload);
    return data ?? null;
  } catch {
    return null;
  }
}
