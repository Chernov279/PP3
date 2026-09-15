// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile } from '../types/movie';
import { authService, getAccessToken, clearTokens, setTokens, userService } from '../services/api';
import { UserResponse } from '../types/auth';

interface User extends UserResponse {
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: (allDevices?: boolean) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateAvatar: (avatarUrl: string | null) => void;
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
  is_kinopoisk_synchronized: false,
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

      let favoriteMovieIds: number[] = [];
      try {
        const favorites = await userService.getFavorites("me");
        favoriteMovieIds = favorites.map((m) => m.id);
      } catch {
        favoriteMovieIds = loadStoredProfile().favoriteMovies;
      }

      // Базовый профиль: либо из localStorage, либо дефолтный.
      const storedProfile = loadStoredProfile();
      const mergedProfile: UserProfile = {
        ...storedProfile,
        favoriteMovies: favoriteMovieIds,
        is_kinopoisk_synchronized:
          userData.is_kinopoisk_synchronized ?? storedProfile.is_kinopoisk_synchronized,
      };

      // Сохраняем профиль сразу после успешного /me.
      storeProfile(mergedProfile);

      setUser({ ...userData, profile: mergedProfile });
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

  const logout = useCallback(async (allDevices = false) => {
    try {
      if (allDevices) {
        await authService.logoutAllSessions();
      } else {
        await authService.logoutSession();
      }
    } catch {
      // Даже если сервер не отозвал токен, локальную сессию закрываем
    }
    authService.logout();
    clearTokens();
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const updateUserProfile = useCallback(async (profile: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const current = prev.profile || defaultProfile;
      const next = { ...current, ...profile };
      storeProfile(next);
      return { ...prev, profile: next };
    });
  }, []);

  const updateAvatar = (avatarUrl: string | null) => {
    setUser((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : null));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserProfile,
    updateAvatar,
    refreshProfile: fetchUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
