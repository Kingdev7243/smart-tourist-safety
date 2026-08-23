import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Admin } from '../types';
import { loginAdmin, LoginResponse } from '../api/auth';
import { setAuthToken, getAuthToken, setOnUnauthorizedCallback } from '../api/client';

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const savedAdmin = localStorage.getItem('tourist_safety_admin_user');
    if (savedAdmin) {
      try {
        return JSON.parse(savedAdmin) as Admin;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    setTokenState(null);
    setAdmin(null);
    setAuthToken(null);
    localStorage.removeItem('tourist_safety_admin_user');
  }, []);

  useEffect(() => {
    // Setup automatic 401 interceptor
    setOnUnauthorizedCallback(() => {
      logout();
      setError('Session expired or unauthorized. Please sign in again.');
    });
  }, [logout]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await loginAdmin({ email, password });
      setTokenState(response.access_token);
      setAdmin(response.admin);
      setAuthToken(response.access_token);
      localStorage.setItem('tourist_safety_admin_user', JSON.stringify(response.admin));
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      return false;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
