import { apiClient } from './client';
import { Alert, AlertStatus } from '../types';

export async function getAlerts(): Promise<Alert[]> {
  return apiClient<Alert[]>('/api/alerts', {
    method: 'GET',
  });
}

export async function getAlert(alertId: number): Promise<Alert> {
  return apiClient<Alert>(`/api/alerts/${alertId}`, {
    method: 'GET',
  });
}

export async function updateAlert(
  alertId: number,
  data: Partial<{
    status: AlertStatus;
    acknowledged_at: string | null;
    acknowledged_by: number | null;
    closed_at: string | null;
  }>
): Promise<Alert> {
  return apiClient<Alert>(`/api/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
