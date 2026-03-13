import { Genre, Movie, Person } from "../types/movie";
import { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "../types/auth";

function getApiBaseUrl() {
  const raw =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";
  return String(raw).replace(/\/+$/, "");
}

const API_BASE_URL = getApiBaseUrl();

type BackendGenre = { id: number; name: string };
type BackendRecommendedFilm = {
  id: number;
  title: string;
  original_title?: string | null;
  poster_url?: string | null;
  kp_rating?: number | null;
  imdb_rating?: number | null;
  year?: number | null;
  genres?: BackendGenre[];
  popularity_score: number;
  novelty_score: number;
  personalization_score?: number | null;
  total_score: number;
};

type BackendWatchHistoryItem = {
  watch_history: {
    id: number;
    user_id: number;
    movie_id: number;
    watched_at?: string | null;
    watch_duration?: number | null;
    rating?: number | null;
  };
  movie: {
    id: number;
    title: string;
    original_title?: string | null;
    poster_url?: string | null;
    kp_rating?: number | null;
    imdb_rating?: number | null;
    description?: string | null;
    release_date?: string | null;
    duration?: number | null;
    vote_count?: number | null;
  };
};

type BackendFilm = {
  id: number;
  title: string;
  original_title?: string | null;
  poster_url?: string | null;
  kp_rating?: number | null;
  imdb_rating?: number | null;
  release_date?: string | null;
  description?: string | null;
  popularity?: number | null;
};

type BackendSimilarFilm = {
  filmId: number;
  nameRu?: string | null;
  nameEn?: string | null;
  nameOriginal?: string | null;
  posterUrl?: string | null;
};

function normalizeMovieFromRecommendation(m: BackendRecommendedFilm): Movie {
  return {
    id: m.id,
    title: m.title,
    year: m.year ?? 0,
    genres: (m.genres || []).map((g) => ({ id: g.id, name: g.name })),
    rating: Number(m.kp_rating ?? m.imdb_rating ?? 0),
    popularity: 0,
    description: "",
    poster: m.poster_url || "",
    actors: [],
    director: "",
    playerUrl: "",
    imdbRating: m.imdb_rating ?? undefined,
    kinopoiskRating: m.kp_rating ?? undefined,
    popularity_score: m.popularity_score,
    novelty_score: m.novelty_score,
    personalization_score: m.personalization_score ?? undefined,
    total_score: m.total_score,
  };
}

function normalizeMovieFromWatchHistory(item: BackendWatchHistoryItem): Movie {
  const m = item.movie;
  const year =
    typeof m.release_date === "string" && m.release_date.length >= 4
      ? Number(m.release_date.slice(0, 4))
      : 0;
  return {
    id: m.id,
    title: m.title,
    year,
    genres: [],
    rating: Number(m.kp_rating ?? m.imdb_rating ?? item.watch_history.rating ?? 0),
    popularity: 0,
    description: m.description || "",
    poster: m.poster_url || "",
    actors: [],
    director: "",
    playerUrl: "",
    imdbRating: m.imdb_rating ?? undefined,
    kinopoiskRating: m.kp_rating ?? undefined,
  };
}

function normalizeMovieFromFilm(f: BackendFilm): Movie {
  const year =
    typeof f.release_date === "string" && f.release_date.length >= 4
      ? Number(f.release_date.slice(0, 4))
      : 0;
  return {
    id: f.id,
    title: f.title,
    year,
    genres: [],
    rating: Number(f.kp_rating ?? f.imdb_rating ?? 0),
    popularity: Number(f.popularity ?? 0),
    description: f.description || "",
    poster: f.poster_url || "",
    actors: [],
    director: "",
    playerUrl: "",
    imdbRating: f.imdb_rating ?? undefined,
    kinopoiskRating: f.kp_rating ?? undefined,
  };
}

// --- Token Management ---
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// --- API Client ---

interface ApiError {
  detail: string | { msg: string }[];
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data: TokenResponse = await refreshResponse.json();
          setTokens(data.access_token, data.refresh_token);
          headers["Authorization"] = `Bearer ${data.access_token}`;
          response = await fetch(url, { ...options, headers });
        } else {
          clearTokens();
          window.location.href = "/";
          throw new Error("Session expired. Please login again.");
        }
      } catch (error) {
        clearTokens();
        throw error;
      }
    }
  }

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({ detail: "Unknown error" }));
    const errorMessage = typeof errorData.detail === 'string' 
      ? errorData.detail 
      : JSON.stringify(errorData.detail);
    throw new Error(errorMessage || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// --- Auth Endpoints ---
export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    return apiRequest<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async register(data: RegisterRequest): Promise<TokenResponse> {
    return apiRequest<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<UserResponse> {
    return apiRequest<UserResponse>("/users/me");
  },

  logout() {
    clearTokens();
  }
};

// --- Movie Endpoints ---
export const movieService = {
  async getRecommendations(params: any = {}): Promise<Movie[]> {
    const query = new URLSearchParams();
    if (params.user_id != null) query.append("user_id", String(params.user_id));
    if (params.popularity_weight !== undefined) query.append("popularity_weight", String(params.popularity_weight));
    if (params.novelty_weight !== undefined) query.append("novelty_weight", String(params.novelty_weight));
    if (params.personalization_weight !== undefined) query.append("personalization_weight", String(params.personalization_weight));
    if (params.genre_ids?.length) {
      for (const id of params.genre_ids) query.append("genre_ids", String(id));
    }
    if (params.exclude_genre_ids?.length) {
      for (const id of params.exclude_genre_ids) query.append("exclude_genre_ids", String(id));
    }
    if (params.year_from !== undefined) query.append("year_from", String(params.year_from));
    if (params.year_to !== undefined) query.append("year_to", String(params.year_to));
    if (params.limit !== undefined) query.append("limit", String(params.limit));

    const raw = await apiRequest<BackendRecommendedFilm[]>(`/recommendations/?${query.toString()}`);
    return raw.map(normalizeMovieFromRecommendation);
  },

  async getSimilarFilms(filmId: number): Promise<Movie[]> {
    const raw = await apiRequest<BackendSimilarFilm[]>(`/films/${filmId}/similars`);
    return raw.map((s) => ({
      id: s.filmId,
      title: s.nameOriginal || s.nameRu || s.nameEn || `Фильм ${s.filmId}`,
      year: 0,
      genres: [],
      rating: 0,
      popularity: 0,
      description: "",
      poster: s.posterUrl || "",
      actors: [],
      director: "",
      playerUrl: "",
    }));
  },

  async getAllGenres(): Promise<Genre[]> {
    return apiRequest<Genre[]>("/films/all-genres");
  },

  async syncKinopoiskWatchHistory(kinopoiskId: number): Promise<any> {
    const query = new URLSearchParams({ kinopoisk_id: String(kinopoiskId) });
    return apiRequest(`/users/sync_kinopoisk_info?${query.toString()}`, { method: "POST" });
  },
  
  async getFilmDetails(filmId: number): Promise<Movie> {
    const raw = await apiRequest<BackendFilm>(`/films/${filmId}`);
    return normalizeMovieFromFilm(raw);
  },

  async getFilmGenres(filmId: number): Promise<Genre[]> {
    return apiRequest<Genre[]>(`/films/${filmId}/genres`);
  },

  async searchFilms(_query: string): Promise<Movie[]> {
    return [];
  }
};

export const userService = {
  async getUser(userId: string | number = "me"): Promise<UserResponse> {
    const id = String(userId);
    const endpoint = id === "me" ? "/users/me" : `/users/${id}`;
    return apiRequest<UserResponse>(endpoint);
  },

  async updateUser(data: { name: string; email: string }): Promise<UserResponse> {
    return apiRequest<UserResponse>(`/users/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  
  async getFavorites(_userId: string = "me"): Promise<Movie[]> {
    const raw = await apiRequest<BackendFilm[]>(`/films/favorite`);
    return raw.map(normalizeMovieFromFilm);
  },

  async toggleFavorite(
    _userId: string = "me",
    filmId: number,
    action: "add" | "remove"
  ): Promise<{ success: boolean }> {
    if (action === "add") {
      await apiRequest(`/films/favorite/${filmId}`, { method: "POST" });
    } else {
      await apiRequest(`/films/favorite/${filmId}`, { method: "DELETE" });
    }
    return { success: true };
  },
  
  async getWatched(userId: string | number = "me"): Promise<Movie[]> {
    // Если userId = "me", нам возможно нужно получить id из контекста.
    // Но бэкенд может принимать и "me", либо мы просто передаем id. 
    // Предполагаем, что бэкенд ожидает реальный user_id, так как в роуте `/users/{user_id}/films`
    // Будем подставлять userId
    const raw = await apiRequest<BackendWatchHistoryItem[]>(`/users/${String(userId)}/films`);
    return raw.map(normalizeMovieFromWatchHistory);
  }
};

export const genreService = {
  async getFavorites(): Promise<Genre[]> {
    return apiRequest<Genre[]>("/genres/favorite");
  },
  async addFavorite(genreId: number): Promise<boolean> {
    return apiRequest<boolean>(`/genres/favorite/${genreId}`, { method: "POST" });
  },
  async removeFavorite(genreId: number): Promise<boolean> {
    return apiRequest<boolean>(`/genres/favorite/${genreId}`, { method: "DELETE" });
  },
};

export const personService = {
  async search(query: string, page = 1): Promise<Person[]> {
    const params = new URLSearchParams({ query, page: String(page) });
    const raw = await apiRequest<
      {
        kinopoiskId: number;
        nameRu?: string | null;
        nameEn?: string | null;
        posterUrl?: string | null;
        profession?: string | null;
      }[]
    >(`/persons/search?${params.toString()}`);
    return raw.map((p) => ({
      id: p.kinopoiskId,
      name_ru: p.nameRu,
      name_en: p.nameEn,
      poster_url: p.posterUrl,
      profession: p.profession,
    }));
  },
  async getFavorites(): Promise<Person[]> {
    return apiRequest<Person[]>("/persons/favorite");
  },
  async addFavorite(personId: number): Promise<boolean> {
    return apiRequest<boolean>(`/persons/favorite/${personId}`, { method: "POST" });
  },
  async removeFavorite(personId: number): Promise<boolean> {
    return apiRequest<boolean>(`/persons/favorite/${personId}`, { method: "DELETE" });
  },
};
