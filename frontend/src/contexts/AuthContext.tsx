// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/movie';
import { authService, getAccessToken, clearTokens, setTokens } from '../services/api';
import { UserResponse } from '../types/auth';

interface User extends UserResponse {
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
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

const USER_PROFILE_KEY = "user_profile";

const defaultProfile: UserProfile = {
  favoriteGenres: [],
  favoriteActors: [],
  watchedMovies: [],
  favoriteMovies: [],
  imdbConnected: false,
  kinopoiskConnected: false,
};

function loadStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return defaultProfile;
  }
}

function storeProfile(profile: UserProfile) {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Fetch basic user info
      // Note: If /users/me fails (e.g. invalid token), interceptor might clear tokens.
      // We should handle that gracefully.
      const userData = await authService.getMe();
      setUser({ ...userData, profile: loadStoredProfile() });
    } catch (error) {
      console.error("Auth check failed:", error);
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email: email, password });
      setTokens(response.access_token, response.refresh_token);
      console.log('Login response:', response);
      console.log('Access token from response:', response.access_token);
      
      // Fetch user data after successful login
      await fetchUser();
      return true;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await authService.register({ email, password, name });
      setTokens(response.access_token, response.refresh_token);
      await fetchUser();
      return true;
    } catch (e) {
      console.error('Registration error:', e);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUserProfile = async (profile: UserProfile) => {
    if (!user) return;
    setUser(prev => (prev ? { ...prev, profile } : null));
    storeProfile(profile);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserProfile,
    refreshProfile: fetchUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
