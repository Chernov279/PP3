export interface Movie {
  id: number;
  title: string;
  titleRu?: string;
  year: number;
  genres: string[];
  rating: number;
  popularity: number; // 0-100, где 100 = очень популярный
  description: string;
  poster: string;
  actors: string[];
  director: string;
  imdbRating?: number;
  kinopoiskRating?: number;
  playerUrl: string;
}

export interface UserProfile {
  favoriteGenres: string[];
  favoriteActors: string[];
  watchedMovies: number[];
  favoriteMovies: number[];
  imdbConnected: boolean;
  kinopoiskConnected: boolean;
}
