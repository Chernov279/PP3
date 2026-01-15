// src/types/api.ts
export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  favorite_genres: string[];
  favorite_actors: string[];
  watched_movies: number[];
  favorite_movies: number[];
  imdb_connected: boolean;
  kinopoisk_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  year: number;
  director: string;
  description: string;
  poster_url: string;
  backdrop_url?: string;
  duration: number;
  rating: number;
  popularity: number;
  genres: string[];
  actors: string[];
  country: string;
  language: string;
  trailer_url?: string;
  imdb_id?: string;
  kinopoisk_id?: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface SearchParams {
  q?: string;
  genres?: string[];
  actors?: string[];
  year_from?: number;
  year_to?: number;
  rating_from?: number;
  rating_to?: number;
  sort_by?: 'rating' | 'year' | 'popularity' | 'title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface FilterRanges {
  year: { min: number; max: number };
  rating: { min: number; max: number };
  popularity: { min: number; max: number };
}

export interface RecommendationParams {
  popularity_weight?: number;
  min_rating?: number;
  year_from?: number;
  limit?: number;
}