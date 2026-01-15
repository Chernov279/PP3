// src/services/authApi.ts
import { api, handleApiError } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User, UserProfile, ApiResponse } from '../types/api';

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      const { access_token, refresh_token, user } = response.data.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
      const { access_token, refresh_token, user } = response.data.data;
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  async getUserProfile(): Promise<UserProfile> {
    const response = await api.get<ApiResponse<UserProfile>>('/user/profile');
    return response.data.data;
  },

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.put<ApiResponse<UserProfile>>('/user/profile', profile);
    return response.data.data;
  },

  checkAuth(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};