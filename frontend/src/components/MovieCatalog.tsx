import { Movie } from "../types/movie";
import { MovieCard } from "./MovieCard";
import { FilterPanel } from "./FilterPanel";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "./ui/alert";
import { Info, Loader2 } from "lucide-react";

interface MovieCatalogProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  popularityWeight: number[];
  onPopularityWeightChange: (value: number[]) => void;
  minRating: number[];
  onMinRatingChange: (value: number[]) => void;
  yearRange: number[];
  onYearRangeChange: (value: number[]) => void;
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  allGenres: string[];
  loading?: boolean;
}

export function MovieCatalog({ 
  movies, 
  onMovieClick,
  popularityWeight,
  onPopularityWeightChange,
  minRating,
  onMinRatingChange,
  yearRange,
  onYearRangeChange,
  selectedGenres,
  onGenresChange,
  allGenres,
  loading = false,
}: MovieCatalogProps) {
  const { isAuthenticated, user } = useAuth();

  const favoriteGenres = user?.profile?.favoriteGenres || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2>Рекомендации для вас</h2>
        <p className="text-muted-foreground">
          Подборка фильмов на основе ваших предпочтений
        </p>
      </div>

      {!isAuthenticated && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Войдите в аккаунт, чтобы получать персонализированные рекомендации на основе ваших любимых жанров и актёров
          </AlertDescription>
        </Alert>
      )}

      <FilterPanel
        popularityWeight={popularityWeight}
        onPopularityWeightChange={onPopularityWeightChange}
        minRating={minRating}
        onMinRatingChange={onMinRatingChange}
        yearRange={yearRange}
        onYearRangeChange={onYearRangeChange}
        selectedGenres={selectedGenres}
        onGenresChange={onGenresChange}
        allGenres={allGenres}
        favoriteGenres={favoriteGenres}
      />
      
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка фильмов...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-8">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie)}
              />
            ))}
          </div>

          {movies.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>Нет фильмов, соответствующих выбранным фильтрам.</p>
              <p>Попробуйте изменить параметры фильтрации.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
