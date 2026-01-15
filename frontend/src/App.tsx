// App.tsx
import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { MovieCatalog } from "./components/MovieCatalog";
import { AccountPage } from "./components/AccountPage";
import { SearchDialog } from "./components/SearchDialog";
import { MovieDetailsDialog } from "./components/MovieDetailsDialog";
import { Movie } from "./types/api";
import { AuthDialog } from "./components/AuthDialog";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { toast } from "sonner";
import { movieApi } from "./services/movieAPI";

type View = "catalog" | "account";

function AppContent() {
  const { user, profile, isAuthenticated, updateUserProfile, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>("catalog");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  const [popularityWeight, setPopularityWeight] = useState<number[]>([50]);
  const [minRating, setMinRating] = useState<number[]>([0]);
  const [yearRange, setYearRange] = useState<number[]>([1900]);
  
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [popularityWeight[0], minRating[0], yearRange[0], isAuthenticated]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const movies = await movieApi.getRecommendations({
        popularity_weight: popularityWeight[0],
        min_rating: minRating[0],
        year_from: yearRange[0],
        limit: 20,
      });
      setRecommendedMovies(movies);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast.error('Ошибка загрузки рекомендаций');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovieClick = async (movie: Movie) => {
    try {
      setSelectedMovie(movie);
      setIsMovieDialogOpen(true);
      
      if (isAuthenticated) {
        await movieApi.markAsWatched(movie.id);
      }
    } catch (error) {
      console.error('Failed to mark as watched:', error);
      setSelectedMovie(movie);
      setIsMovieDialogOpen(true);
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedMovie) return;

    try {
      const result = await movieApi.toggleFavorite(selectedMovie.id);
      
      if (profile) {
        const isCurrentlyFavorite = profile.favorite_movies.includes(selectedMovie.id);
        const updatedFavorites = isCurrentlyFavorite
          ? profile.favorite_movies.filter(id => id !== selectedMovie.id)
          : [...profile.favorite_movies, selectedMovie.id];
        
        await updateUserProfile({
          favorite_movies: updatedFavorites,
        });
      }
      
      setRecommendedMovies(prev =>
        prev.map(movie =>
          movie.id === selectedMovie.id
            ? { ...movie, is_favorite: result.is_favorite }
            : movie
        )
      );
      
      toast.success(result.is_favorite ? 'Добавлено в избранное' : 'Удалено из избранного');
    } catch (error) {
      toast.error('Ошибка обновления избранного');
    }
  };

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setCurrentView("account");
    } else {
      setIsAuthDialogOpen(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView("catalog");
    loadRecommendations();
  };

  const isFavorite = selectedMovie && profile
    ? profile.favorite_movies.includes(selectedMovie.id)
    : false;

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearchClick={() => setIsSearchOpen(true)}
        onAccountClick={handleAccountClick}
        onLogoClick={() => setCurrentView("catalog")}
        onLoginClick={() => setIsAuthDialogOpen(true)}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        onLogout={handleLogout}
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
          isLoading={isLoading}
        />
      )}

      {currentView === "account" && profile && (
        <AccountPage
          profile={profile}
          onUpdateProfile={updateUserProfile}
          onMovieClick={handleMovieClick}
          onBack={() => setCurrentView("catalog")}
        />
      )}

      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onMovieClick={handleMovieClick}
      />

      <MovieDetailsDialog
        movie={selectedMovie}
        open={isMovieDialogOpen}
        onOpenChange={setIsMovieDialogOpen}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <AuthDialog
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}