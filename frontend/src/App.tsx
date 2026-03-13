import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "./components/Header";
import { MovieCatalog } from "./components/MovieCatalog";
import { AccountPage } from "./components/AccountPage";
import { SearchDialog } from "./components/SearchDialog";
import { MovieDetailsDialog } from "./components/MovieDetailsDialog";
import { AuthDialog } from "./components/AuthDialog";
import { Genre, Movie } from "./types/movie";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { toast } from "sonner";
import { movieService, userService } from "./services/api";
import { useApi } from "./hooks/useApi";
import { Button } from "./components/ui/button";
import { Film } from "lucide-react";

type View = "catalog" | "account";

function AppContent() {
  const { user, isAuthenticated, updateUserProfile, logout, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<View>("catalog");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  // Состояния для фильтров
  const [popularityWeight, setPopularityWeight] = useState<number[]>([50]);
  const [minRating, setMinRating] = useState<number[]>([0]);
  const [yearRange, setYearRange] = useState<number[]>([1900]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Получаем профиль пользователя
  const userProfile = user?.profile || {
    favoriteGenres: [],
    favoriteActors: [],
    watchedMovies: [],
    favoriteMovies: [],
    imdbConnected: false,
    is_kinopoisk_synchronized: user?.profile?.is_kinopoisk_synchronized || false,
  };

  const fetchGenres = useCallback(() => movieService.getAllGenres(), []);

  // Загружаем жанры из API (fetch on mount if authenticated)
  const {
    data: apiGenresRaw,
    refetch: refetchGenres,
  } = useApi(fetchGenres, { immediate: false });

  const allGenres: Genre[] = useMemo(() => apiGenresRaw || [], [apiGenresRaw]);
  const apiGenres = useMemo(() => allGenres.map((g) => g.name), [allGenres]);

  // Подтягиваем жанры, когда пользователь авторизован
  useEffect(() => {
    if (isAuthenticated) {
      refetchGenres();
    }
  }, [isAuthenticated, refetchGenres]);

  // Determine if we should fetch recommendations
  // Загружаем рекомендации только если пользователь синхронизировал Кинопоиск.
  const shouldFetchRecommendations = isAuthenticated && userProfile.is_kinopoisk_synchronized;

  const fetchRecommendations = useCallback(() => {
    const popularityW = Math.min(1, Math.max(0, popularityWeight[0] / 100));
    const personalizationW = Math.min(1, Math.max(0, minRating[0] / 100));

    const selectedGenreIds = selectedGenres
      .map((name) => allGenres.find((g) => g.name === name)?.id)
      .filter((id): id is number => typeof id === "number");

    return movieService.getRecommendations({
      user_id: user?.id,
      popularity_weight: popularityW,
      personalization_weight: personalizationW,
      year_from: yearRange[0],
      genre_ids: selectedGenreIds.length ? selectedGenreIds : undefined,
      limit: 50,
    });
  }, [allGenres, selectedGenres, popularityWeight, minRating, user?.id, yearRange]);

  const {
    data: recommendedMovies,
    loading: moviesLoading,
    error: moviesError,
    refetch: refetchMovies,
  } = useApi(
    fetchRecommendations,
    { immediate: shouldFetchRecommendations }
  );

  // Re-fetch recommendations explicitly when dependencies change
  // We use this because `useApi` is now strict and only auto-fetches once
  // to 100% avoid infinite loops.
  useEffect(() => {
    if (shouldFetchRecommendations) {
      refetchMovies();
    }
  }, [fetchRecommendations, shouldFetchRecommendations, refetchMovies]);

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsMovieDialogOpen(true);
  };

  const handleToggleFavorite = async () => {
    if (!selectedMovie || !isAuthenticated || !user?.id) {
        toast.error("Пожалуйста, войдите в систему");
        return;
    }

    const isFavorite = userProfile.favoriteMovies.includes(selectedMovie.id);
    
    try {
        await userService.toggleFavorite("me", selectedMovie.id, isFavorite ? "remove" : "add");
        
        const newFavorites = isFavorite
            ? userProfile.favoriteMovies.filter(id => id !== selectedMovie.id)
            : [...userProfile.favoriteMovies, selectedMovie.id];
            
        updateUserProfile({ ...userProfile, favoriteMovies: newFavorites });
        
        toast.success(isFavorite ? "Удалено из избранного" : "Добавлено в избранное");
    } catch (e) {
        toast.error("Не удалось обновить избранное");
        console.error(e);
    }
  };

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setCurrentView("account");
    } else {
      setIsAuthDialogOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Вы вышли из аккаунта");
    setCurrentView("catalog");
  };

  const isFavorite = selectedMovie
    ? (userProfile.favoriteMovies || []).includes(selectedMovie.id)
    : false;

  useEffect(() => {
    if (moviesError && shouldFetchRecommendations) {
      toast.error(`Ошибка загрузки фильмов: ${moviesError}`);
    }
  }, [moviesError, shouldFetchRecommendations]);

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Загрузка...</div>;
  }

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

      {!isAuthenticated ? (
        <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center space-y-8">
          <div className="p-6 bg-primary/10 rounded-full">
            <Film className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Добро пожаловать в КиноРек
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Ваш персональный сервис рекомендаций фильмов. Мы анализируем ваши предпочтения, 
            чтобы предложить именно то, что вам понравится.
          </p>
          <div className="flex gap-4">
            <Button size="lg" onClick={() => setIsAuthDialogOpen(true)}>
              Войти / Регистрация
            </Button>
          </div>
        </div>
      ) : (
        <>
          {currentView === "catalog" && (
            <>
              {!userProfile.is_kinopoisk_synchronized ? (
                <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center space-y-6">
                  <h2 className="text-2xl font-semibold">Подключите Кинопоиск</h2>
                  <p className="text-muted-foreground max-w-md">
                    Для получения персональных рекомендаций необходимо синхронизировать историю просмотров с Кинопоиска.
                  </p>
                  <Button onClick={() => setCurrentView("account")}>
                    Перейти в профиль
                  </Button>
                </div>
              ) : (
                <MovieCatalog
                  movies={recommendedMovies || []}
                  onMovieClick={handleMovieClick}
                  popularityWeight={popularityWeight}
                  onPopularityWeightChange={setPopularityWeight}
                  minRating={minRating}
                  onMinRatingChange={setMinRating}
                  yearRange={yearRange}
                  onYearRangeChange={setYearRange}
                  selectedGenres={selectedGenres}
                  onGenresChange={setSelectedGenres}
                  allGenres={apiGenres}
                  loading={moviesLoading}
                />
              )}
            </>
          )}

          {currentView === "account" && (
            <AccountPage
              profile={userProfile}
              onUpdateProfile={updateUserProfile}
              onMovieClick={handleMovieClick}
              onBack={() => setCurrentView("catalog")}
            />
          )}
        </>
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
