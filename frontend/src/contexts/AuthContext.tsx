// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserProfile } from '../types/api';
import { authApi } from '../services/authAPI';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authApi.getStoredUser();
        
        if (storedUser && authApi.checkAuth()) {
          const freshUser = await authApi.getCurrentUser();
          setUser(freshUser);
          
          try {
            const userProfile = await authApi.getUserProfile();
            setProfile(userProfile);
          } catch (profileError) {
            console.error('Failed to load profile:', profileError);
            setProfile({
              id: freshUser.id,
              user_id: freshUser.id,
              favorite_genres: [],
              favorite_actors: [],
              watched_movies: [],
              favorite_movies: [],
              imdb_connected: false,
              kinopoisk_connected: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password, remember: true });
      setUser(response.user);
      
      try {
        const userProfile = await authApi.getUserProfile();
        setProfile(userProfile);
      } catch (profileError) {
        console.error('Failed to load profile after login:', profileError);
        setProfile({
          id: response.user.id,
          user_id: response.user.id,
          favorite_genres: [],
          favorite_actors: [],
          watched_movies: [],
          favorite_movies: [],
          imdb_connected: false,
          kinopoisk_connected: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      toast.success('Вход выполнен успешно!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка входа');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.register({ 
        name, 
        email, 
        password, 
        confirm_password: confirmPassword 
      });
      setUser(response.user);
      
      try {
        const userProfile = await authApi.getUserProfile();
        setProfile(userProfile);
      } catch (profileError) {
        console.error('Failed to load profile after registration:', profileError);
        setProfile({
          id: response.user.id,
          user_id: response.user.id,
          favorite_genres: [],
          favorite_actors: [],
          watched_movies: [],
          favorite_movies: [],
          imdb_connected: false,
          kinopoisk_connected: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      toast.success('Регистрация прошла успешно!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка регистрации');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
      setUser(null);
      setProfile(null);
      toast.success('Выход выполнен');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) {
      throw new Error('User profile not loaded');
    }

    try {
      const updatedProfile = await authApi.updateUserProfile(updates);
      setProfile(updatedProfile);
      toast.success('Профиль обновлен');
    } catch (error) {
      toast.error('Ошибка обновления профиля');
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (authApi.checkAuth() && user) {
        const freshUser = await authApi.getCurrentUser();
        setUser(freshUser);
        
        const userProfile = await authApi.getUserProfile();
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};