import { Movie } from "../types/movie";
import { MovieCard } from "./MovieCard";
import { FilterPanel } from "./FilterPanel";

interface MovieCatalogProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  popularityWeight: number[];
  onPopularityWeightChange: (value: number[]) => void;
  minRating: number[];
  onMinRatingChange: (value: number[]) => void;
  yearRange: number[];
  onYearRangeChange: (value: number[]) => void;
}

export function MovieCatalog({ 
  movies, 
  onMovieClick,
  popularityWeight,
  onPopularityWeightChange,
  minRating,
  onMinRatingChange,
  yearRange,
  onYearRangeChange
}: MovieCatalogProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h2>Рекомендации для вас</h2>
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
    </div>
  );
}
