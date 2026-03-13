export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  is_kinopoisk_synchronized?: boolean;
}
