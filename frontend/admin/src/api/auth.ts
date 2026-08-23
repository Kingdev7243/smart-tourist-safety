import { apiClient } from './client';
import { Admin } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  admin: Admin;
}

export async function loginAdmin(credentials: { email: string; password: string }): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getAdmins(): Promise<Admin[]> {
  return apiClient<Admin[]>('/api/auth/admins', {
    method: 'GET',
  });
}
