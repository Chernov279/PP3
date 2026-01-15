// src/services/movieApi.ts
import { api, handleApiError } from './api';
import { Movie, PaginatedResponse, SearchParams, FilterRanges, RecommendationParams, ApiResponse } from '../types/api';

export const movieApi = {
  async getRecommendations(params?: RecommendationParams): Promise<Movie[]> {
    try {
      const response = await api.get<ApiResponse<Movie[]>>('/movies/recommendations', {
        params: {
          popularity_weight: params?.popularity_weight,
          min_rating: params?.min_rating,
          year_from: params?.year_from,
          limit: params?.limit || 20,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  },

  async searchMovies(params: SearchParams): Promise<PaginatedResponse<Movie>> {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<Movie>>>('/movies/search', { params });
      return response.data.data;
    } catch (error) {
      console.error('Search error:', error);
      return { items: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
    }
  },

  async getMovieById(id: number): Promise<Movie> {
    const response = await api.get<ApiResponse<Movie>>(`/movies/${id}`);
    return response.data.data;
  },

  async getMoviesByIds(ids: number[]): Promise<Movie[]> {
    if (ids.length === 0) return [];
    const response = await api.post<ApiResponse<Movie[]>>('/movies/batch', { ids });
    return response.data.data;
  },

  async getFilterRanges(): Promise<FilterRanges> {
    try {
      const response = await api.get<ApiResponse<FilterRanges>>('/movies/filters/ranges');
      return response.data.data;
    } catch (error) {
      console.error('Filter ranges error:', error);
      return {
        year: { min: 1900, max: new Date().getFullYear() },
        rating: { min: 0, max: 10 },
        popularity: { min: 0, max: 100 },
      };
    }
  },

  async toggleFavorite(movieId: number): Promise<{ is_favorite: boolean }> {
    const response = await api.post<ApiResponse<{ is_favorite: boolean }>>(`/movies/${movieId}/favorite`);
    return response.data.data;
  },

  async getFavorites(): Promise<Movie[]> {
    const response = await api.get<ApiResponse<Movie[]>>('/user/favorites');
    return response.data.data;
  },

  async getWatchedMovies(): Promise<Movie[]> {
    const response = await api.get<ApiResponse<Movie[]>>('/user/watched');
    return response.data.data;
  },

  async markAsWatched(movieId: number): Promise<void> {
    await api.post(`/movies/${movieId}/watched`);
  },
};