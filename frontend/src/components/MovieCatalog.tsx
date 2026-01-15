import { Movie } from "../types/api";
import { MovieCard } from "./MovieCard";
import { FilterPanel } from "./FilterPanel";
import { Loader2 } from "lucide-react";

interface MovieCatalogProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  popularityWeight: number[];
  onPopularityWeightChange: (value: number[]) => void;
  minRating: number[];
  onMinRatingChange: (value: number[]) => void;
  yearRange: number[];
  onYearRangeChange: (value: number[]) => void;
  isLoading?: boolean;
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
  isLoading = false
}: MovieCatalogProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Рекомендации для вас</h2>
        <p className="text-muted-foreground">
          Подборка фильмов на основе ваших предпочтений
        </p>
      </div>

      <FilterPanel
        popularityWeight={popularityWeight}
        onPopularityWeightChange={onPopularityWeightChange}
        minRating={minRating}
        onMinRatingChange={onMinRatingChange}
        yearRange={yearRange}
        onYearRangeChange={onYearRangeChange}
      />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка рекомендаций...</span>
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