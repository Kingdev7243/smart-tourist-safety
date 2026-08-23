import { apiClient } from './client';
import { Incident, IncidentStatus, SeverityLevel } from '../types';

export async function getIncidents(): Promise<Incident[]> {
  return apiClient<Incident[]>('/api/incidents', {
    method: 'GET',
  });
}

export async function getIncident(incidentId: number): Promise<Incident> {
  return apiClient<Incident>(`/api/incidents/${incidentId}`, {
    method: 'GET',
  });
}

export async function createIncident(data: {
  trip_id: number;
  zone_id?: number | null;
  incident_type: string;
  description?: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
}): Promise<Incident> {
  return apiClient<Incident>('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIncident(
  incidentId: number,
  data: Partial<{
    zone_id: number | null;
    description: string;
    severity: SeverityLevel;
    status: IncidentStatus;
    resolved_at: string | null;
    resolved_by: number | null;
  }>
): Promise<Incident> {
  return apiClient<Incident>(`/api/incidents/${incidentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
