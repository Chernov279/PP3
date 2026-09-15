import { Genre, Movie, Person } from "../types/movie";
import { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "../types/auth";
import {
  Collection,
  CollectionDetail,
  CollectionMovie,
  CollectionPage,
  CollectionWritePayload,
} from "../types/collection";

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

type BackendSearchFilm = {
  filmId: number;
  nameRu?: string | null;
  nameEn?: string | null;
  nameOriginal?: string | null;
  year?: number | null;
  rating?: number | null;
  posterUrl?: string | null;
  posterUrlPreview?: string | null;
};

type BackendActor = {
  id: number;
  name_ru?: string | null;
  name_en?: string | null;
  poster_url?: string | null;
  profession?: string | null;
};

function normalizePerson(raw: BackendActor | Record<string, unknown>): Person {
  const p = raw as BackendActor & {
    kinopoiskId?: number;
    personId?: number;
    nameRu?: string;
    nameEn?: string;
    posterUrl?: string;
  };
  return {
    id: p.id ?? p.kinopoiskId ?? p.personId ?? 0,
    name_ru: p.name_ru ?? p.nameRu ?? null,
    name_en: p.name_en ?? p.nameEn ?? null,
    poster_url: p.poster_url ?? p.posterUrl ?? null,
    profession: p.profession ?? null,
  };
}

function normalizeMovieFromSearch(f: BackendSearchFilm): Movie {
  return {
    id: f.filmId,
    title: f.nameRu || f.nameEn || f.nameOriginal || `Фильм ${f.filmId}`,
    year: f.year ?? 0,
    genres: [],
    rating: Number(f.rating ?? 0),
    popularity: 0,
    description: "",
    poster: f.posterUrl || f.posterUrlPreview || "",
    actors: [],
    director: "",
    playerUrl: "",
  };
}

function yearFromReleaseDate(releaseDate?: string | null): number {
  if (typeof releaseDate === "string" && releaseDate.length >= 4) {
    return Number(releaseDate.slice(0, 4)) || 0;
  }
  return 0;
}

export function movieFromCollectionItem(m: CollectionMovie): Movie {
  return {
    id: m.id,
    title: m.title,
    year: yearFromReleaseDate(m.release_date),
    genres: [],
    rating: Number(m.kp_rating ?? 0),
    popularity: 0,
    description: "",
    poster: m.poster_url || "",
    actors: [],
    director: "",
    playerUrl: "",
    kinopoiskRating: m.kp_rating ?? undefined,
  };
}

function normalizeMovieFromFilm(f: BackendFilm): Movie {
  const year = yearFromReleaseDate(f.release_date);
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

function buildAuthHeaders(
  options: RequestInit,
  token: string | null
): Record<string, string> {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  return {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAccessToken();

  let headers = buildAuthHeaders(options, token);

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
          headers = {
            ...buildAuthHeaders(options, data.access_token),
            Authorization: `Bearer ${data.access_token}`,
          };
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

  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const limit = 100;
  const items: T[] = [];
  const join = endpoint.includes("?") ? "&" : "?";
  for (let page = 1; page <= 20; page++) {
    const chunk = await apiRequest<T[]>(`${endpoint}${join}limit=${limit}&page=${page}`);
    const list = Array.isArray(chunk) ? chunk : [];
    items.push(...list);
    if (list.length < limit) break;
  }
  return items;
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

  async logoutSession(): Promise<void> {
    const refreshToken = getRefreshToken();
    await apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  async logoutAllSessions(): Promise<void> {
    await apiRequest("/auth/logout-all", { method: "POST" });
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
    return fetchAllPages<Genre>("/films/all-genres");
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

  async searchFilms(query: string, page = 1): Promise<Movie[]> {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
    });
    const raw = await apiRequest<BackendSearchFilm[]>(`/films/search?${params.toString()}`);
    return raw.map(normalizeMovieFromSearch);
  },

  async searchFilmsInDb(query: string, page = 1, limit = 12): Promise<Movie[]> {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    });
    const raw = await apiRequest<BackendFilm[]>(`/films/db-search?${params.toString()}`);
    return (Array.isArray(raw) ? raw : []).map(normalizeMovieFromFilm);
  },
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
    const raw = await fetchAllPages<BackendFilm>("/films/favorite");
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
  
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const result = await apiRequest<string | { url?: string }>("/users/me/avatar", {
      method: "POST",
      body: formData,
    });
    if (typeof result === "string") return result;
    return result.url ?? "";
  },

  async deleteAvatar(): Promise<void> {
    await apiRequest<unknown>("/users/me/avatar", { method: "DELETE" });
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

export const collectionService = {
  async listMine(page = 1, size = 20): Promise<CollectionPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiRequest<CollectionPage>(`/collections/my?${params.toString()}`);
  },

  async listPublic(page = 1, size = 20): Promise<CollectionPage> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiRequest<CollectionPage>(`/collections/public?${params.toString()}`);
  },

  async search(query: string, page = 1, size = 20, onlyPublic = true): Promise<CollectionPage> {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      size: String(size),
      only_public: String(onlyPublic),
    });
    return apiRequest<CollectionPage>(`/collections/search?${params.toString()}`);
  },

  async getById(collectionId: number): Promise<CollectionDetail> {
    const raw = await apiRequest<CollectionDetail>(`/collections/${collectionId}`);
    return { ...raw, movies: raw.movies || [] };
  },

  async create(data: CollectionWritePayload): Promise<Collection> {
    return apiRequest<Collection>("/collections", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(collectionId: number, data: Partial<CollectionWritePayload>): Promise<Collection> {
    return apiRequest<Collection>(`/collections/${collectionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(collectionId: number): Promise<void> {
    await apiRequest(`/collections/${collectionId}`, { method: "DELETE" });
  },

  async addMovie(collectionId: number, movieId: number): Promise<void> {
    await apiRequest(`/collections/${collectionId}/movies/${movieId}`, { method: "POST" });
  },

  async removeMovie(collectionId: number, movieId: number): Promise<void> {
    await apiRequest(`/collections/${collectionId}/movies/${movieId}`, { method: "DELETE" });
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
    return raw.map((p) => normalizePerson(p));
  },
  async getById(personId: number): Promise<Person> {
    const raw = await apiRequest<BackendActor>(`/persons/${personId}`);
    return normalizePerson(raw);
  },
  async getFavorites(): Promise<Person[]> {
    const raw = await fetchAllPages<BackendActor>("/persons/favorite");
    return raw.map((p) => normalizePerson(p));
  },
  async addFavorite(personId: number): Promise<boolean> {
    return apiRequest<boolean>(`/persons/favorite/${personId}`, { method: "POST" });
  },
  async removeFavorite(personId: number): Promise<boolean> {
    return apiRequest<boolean>(`/persons/favorite/${personId}`, { method: "DELETE" });
  },
};
