import { useState } from "react";
import { Header } from "./components/Header";
import { MovieCatalog } from "./components/MovieCatalog";
import { AccountPage } from "./components/AccountPage";
import { SearchDialog } from "./components/SearchDialog";
import { MovieDetailsDialog } from "./components/MovieDetailsDialog";
import { mockMovies, initialUserProfile } from "./data/mockData";
import { Movie, UserProfile } from "./types/movie";

type View = "catalog" | "account";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("catalog");
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Состояния для фильтров
  const [popularityWeight, setPopularityWeight] = useState<number[]>([50]); // 0 = популярные, 100 = нишевые
  const [minRating, setMinRating] = useState<number[]>([0]);
  const [yearRange, setYearRange] = useState<number[]>([1900]); // минимальный год выпуска

  // Фильтруем фильмы на основе предпочтений пользователя и фильтров
  const getRecommendedMovies = () => {
    return mockMovies.filter((movie) => {
      // Проверяем совпадение с любимыми жанрами
      const hasMatchingGenre = movie.genres.some((genre) =>
        userProfile.favoriteGenres.includes(genre)
      );

      // Проверяем совпадение с любимыми актёрами
      const hasMatchingActor = movie.actors.some((actor) =>
        userProfile.favoriteActors.includes(actor)
      );

      // Если нет предпочтений, показываем все фильмы
      const matchesPreferences = userProfile.favoriteGenres.length === 0 && userProfile.favoriteActors.length === 0
        ? true
        : hasMatchingGenre || hasMatchingActor;

      if (!matchesPreferences) return false;

      // Фильтр по рейтингу
      if (movie.rating < minRating[0]) return false;

      // Фильтр по году
      if (movie.year < yearRange[0]) return false;

      // Фильтр по популярности
      // popularityWeight: 0-30 = популярные (popularity > 70)
      // popularityWeight: 30-70 = все
      // popularityWeight: 70-100 = нишевые (popularity < 70)
      const weight = popularityWeight[0];
      if (weight < 30 && movie.popularity < 70) return false;
      if (weight > 70 && movie.popularity > 70) return false;

      return true;
    });
  };

  const recommendedMovies = getRecommendedMovies();

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsMovieDialogOpen(true);
  };

  const handleToggleFavorite = () => {
    if (!selectedMovie) return;

    const isFavorite = userProfile.favoriteMovies.includes(selectedMovie.id);
    
    setUserProfile({
      ...userProfile,
      favoriteMovies: isFavorite
        ? userProfile.favoriteMovies.filter((id) => id !== selectedMovie.id)
        : [...userProfile.favoriteMovies, selectedMovie.id],
    });
  };

  const isFavorite = selectedMovie
    ? userProfile.favoriteMovies.includes(selectedMovie.id)
    : false;

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        onAccountClick={() => setCurrentView("account")}
        onLogoClick={() => setCurrentView("catalog")}
      />

      {currentView === "catalog" && (
        <MovieCatalog
          movies={recommendedMovies}
          onMovieClick={handleMovieClick}
          popularityWeight={popularityWeight}
          onPopularityWeightChange={setPopularityWeight}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          yearRange={yearRange}
          onYearRangeChange={setYearRange}
        />
      )}

      {currentView === "account" && (
        <AccountPage
          profile={userProfile}
          onUpdateProfile={setUserProfile}
          movies={mockMovies}
          onMovieClick={handleMovieClick}
          onBack={() => setCurrentView("catalog")}
        />
      )}

      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        movies={mockMovies}
        onMovieClick={handleMovieClick}
      />

      <MovieDetailsDialog
        movie={selectedMovie}
        open={isMovieDialogOpen}
        onOpenChange={setIsMovieDialogOpen}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
