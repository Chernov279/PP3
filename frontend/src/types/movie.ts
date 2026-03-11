export interface Genre {
  id: number;
  name: string;
  description?: string;
}

export interface Movie {
  id: number;
  title: string;
  titleRu?: string;
  year: number;
  genres: Genre[];
  rating: number;
  popularity: number; // 0-100, где 100 = очень популярный
  description: string;
  poster: string;
  actors: string[];
  director: string;
  imdbRating?: number;
  kinopoiskRating?: number;
  playerUrl: string;
  // Recommendation scores
  popularity_score?: number;
  novelty_score?: number;
  personalization_score?: number;
  total_score?: number;
}

export interface UserProfile {
  favoriteGenres: string[];
  favoriteActors: string[];
  watchedMovies: number[];
  favoriteMovies: number[];
  imdbConnected: boolean;
  kinopoiskConnected: boolean;
  kinopoiskUserId?: string;
}
