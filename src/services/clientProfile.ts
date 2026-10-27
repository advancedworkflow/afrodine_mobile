import api from '../utils/api';

const BASE = '/profiles';

export interface ClientProfileRead {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  avatar_url?: string | null;
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

/** Envoie la photo de profil (mobile : {uri, name, type} ; web : File) et renvoie le profil à jour. */
export async function uploadClientAvatar(
  file: Blob | { uri: string; name: string; type: string },
): Promise<ClientProfileRead> {
  const formData = new FormData();
  formData.append('file', file as any);
  const { data } = await api.post<ClientProfileRead>(`${BASE}/client/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
