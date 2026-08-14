import api from '../utils/api';

export interface GeoCountry {
  id: number;
  code: string;
  name: string;
  dial_code: string;
}

export interface GeoCity {
  id: number;
  name: string;
}

export async function getReferenceCountries(): Promise<GeoCountry[]> {
  const {data} = await api.get<GeoCountry[]>('/reference/countries');
  return Array.isArray(data) ? data : [];
}

export async function getReferenceCities(countryId: number): Promise<GeoCity[]> {
  const {data} = await api.get<GeoCity[]>(`/reference/countries/${countryId}/cities`);
  return Array.isArray(data) ? data : [];
}
