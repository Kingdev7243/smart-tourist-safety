import { apiClient } from './client';
import { Zone, ZoneType, RiskLevel } from '../types';

export async function getZones(): Promise<Zone[]> {
  return apiClient<Zone[]>('/api/zones', {
    method: 'GET',
  });
}

export async function getZone(zoneId: number): Promise<Zone> {
  return apiClient<Zone>(`/api/zones/${zoneId}`, {
    method: 'GET',
  });
}

export async function createZone(data: {
  name: string;
  description?: string;
  zone_type: ZoneType;
  latitude: number;
  longitude: number;
  radius: number;
  risk_level: RiskLevel;
}): Promise<Zone> {
  return apiClient<Zone>('/api/zones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateZone(
  zoneId: number,
  data: Partial<{
    name: string;
    description: string;
    zone_type: ZoneType;
    latitude: number;
    longitude: number;
    radius: number;
    risk_level: RiskLevel;
    status: 'ACTIVE' | 'INACTIVE';
  }>
): Promise<Zone> {
  return apiClient<Zone>(`/api/zones/${zoneId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
