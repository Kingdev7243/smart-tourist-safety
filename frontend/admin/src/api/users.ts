import { apiClient } from './client';
import { User } from '../types';

export async function getUsers(): Promise<User[]> {
  return apiClient<User[]>('/api/users', {
    method: 'GET',
  });
}

export async function getUser(userId: number): Promise<User> {
  return apiClient<User>(`/api/users/${userId}`, {
    method: 'GET',
  });
}

export async function createUser(data: { name: string; email: string; phone: string }): Promise<User> {
  return apiClient<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
