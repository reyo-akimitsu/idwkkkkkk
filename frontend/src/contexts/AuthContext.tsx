'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/verify');
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        // Try to refresh token
        await refreshToken();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Try to refresh token
      try {
        await refreshToken();
      } catch (refreshError) {
        // Clear invalid tokens
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = Cookies.get('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token');
      }

      const response = await api.post('/auth/refresh', {
        refreshToken: refreshTokenValue
      });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        // Set new tokens
        Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
        Cookies.set('refreshToken', newRefreshToken, { expires: 7 }); // 7 days
        
        // Update API default header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Get user info
        const userResponse = await api.get('/auth/verify');
        if (userResponse.data.success) {
          setUser(userResponse.data.data.user);
        }
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        const { accessToken, refreshToken: refreshTokenValue } = tokens;
        
        // Set tokens in cookies
        Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
        Cookies.set('refreshToken', refreshTokenValue, { expires: 7 }); // 7 days
        
        // Set API default header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        setUser(userData);
        router.push('/');
      } else {
        throw new Error(response.data.error?.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data);
      
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        const { accessToken, refreshToken: refreshTokenValue } = tokens;
        
        // Set tokens in cookies
        Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
        Cookies.set('refreshToken', refreshTokenValue, { expires: 7 }); // 7 days
        
        // Set API default header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        setUser(userData);
        router.push('/');
      } else {
        throw new Error(response.data.error?.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.response?.data?.error?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear tokens and user data
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      router.push('/');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.patch('/users/me', data);
      
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data.error?.message || 'Profile update failed');
      }
    } catch (error: any) {
      console.error('Profile update failed:', error);
      throw new Error(error.response?.data?.error?.message || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
