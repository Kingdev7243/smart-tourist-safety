import { apiClient } from './client';
import { Trip, TripStatus } from '../types';

export async function getTrips(): Promise<Trip[]> {
  return apiClient<Trip[]>('/api/trips', {
    method: 'GET',
  });
}

export async function getTrip(tripId: number): Promise<Trip> {
  return apiClient<Trip>(`/api/trips/${tripId}`, {
    method: 'GET',
  });
}

export async function createTrip(data: {
  user_id: number;
  destination: string;
  start_time: string;
  end_time: string;
}): Promise<Trip> {
  return apiClient<Trip>('/api/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTrip(
  tripId: number,
  data: Partial<{ destination: string; start_time: string; end_time: string; status: TripStatus }>
): Promise<Trip> {
  return apiClient<Trip>(`/api/trips/${tripId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
