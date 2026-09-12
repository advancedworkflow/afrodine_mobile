import api from '../utils/api';

export type ComplaintReason =
  | 'inappropriate_content'
  | 'fake_information'
  | 'spam'
  | 'harassment'
  | 'illegal_activity'
  | 'other';

export interface ComplaintCreatePayload {
  restaurant_id?: number;
  reason: ComplaintReason;
  message: string;
  contact?: string;
}

export interface ComplaintApi {
  id: number;
  restaurant_id: number | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export async function createComplaint(payload: ComplaintCreatePayload): Promise<ComplaintApi> {
  const {data} = await api.post<ComplaintApi>('/complaints/', payload);
  return data;
}
