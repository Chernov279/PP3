export interface Collection {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionMovie {
  id: number;
  title: string;
  poster_url?: string | null;
  release_date?: string | null;
  kp_rating?: number | null;
}

export interface CollectionDetail extends Collection {
  movies: CollectionMovie[];
}

export interface CollectionPage {
  items: Collection[];
  total: number;
  page: number;
  pages: number;
}

export interface CollectionWritePayload {
  title: string;
  description?: string | null;
  is_public: boolean;
}
