import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/movie';
import { initTestUser } from '../data/testUser';

// Начальный профиль пользователя
const defaultUserProfile: UserProfile = {
  favoriteGenres: [],
  favoriteActors: [],
  watchedMovies: [],
  favoriteMovies: [],
  imdbConnected: false,
  kinopoiskConnected: false
};

interface User {
  id: string;
  email: string;
  name: string;
  profile: UserProfile;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profile: UserProfile) => void;
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация тестового пользователя
  useEffect(() => {
    try {
      initTestUser();
      
      // Загрузка сохраненной сессии
      const savedUser = localStorage.getItem('kinorek_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (e) {
      console.error('AuthProvider: Initialization error:', e);
      localStorage.removeItem('kinorek_user');
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Сохранение пользователя в localStorage при изменении
  useEffect(() => {
    if (!isInitialized) return;
    
    if (user) {
      localStorage.setItem('kinorek_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kinorek_user');
    }
  }, [user, isInitialized]);

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const usersData = localStorage.getItem('kinorek_users');
      const users = usersData ? JSON.parse(usersData) : {};

      if (users[email]) {
        return false;
      }

      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        profile: { ...defaultUserProfile }
      };

      users[email] = {
        password,
        userData: newUser
      };

      localStorage.setItem('kinorek_users', JSON.stringify(users));
      setUser(newUser);
      
      return true;
    } catch (e) {
      console.error('Registration error:', e);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const usersData = localStorage.getItem('kinorek_users');
      const users = usersData ? JSON.parse(usersData) : {};

      if (users[email] && users[email].password === password) {
        setUser(users[email].userData);
        return true;
      }

      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserProfile = (profile: UserProfile) => {
    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        profile
      };

      setUser(updatedUser);

      const usersData = localStorage.getItem('kinorek_users');
      const users = usersData ? JSON.parse(usersData) : {};
      
      if (users[user.email]) {
        users[user.email].userData = updatedUser;
        localStorage.setItem('kinorek_users', JSON.stringify(users));
      }
    } catch (e) {
      console.error('Update profile error:', e);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
