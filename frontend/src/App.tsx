import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "./components/Header";
import { MovieCatalog } from "./components/MovieCatalog";
import { AccountPage } from "./components/AccountPage";
import { SearchDialog } from "./components/SearchDialog";
import { MovieDetailsDialog } from "./components/MovieDetailsDialog";
import { AuthDialog } from "./components/AuthDialog";
import { Genre, Movie, Person } from "./types/movie";
import { PersonDetailsDialog } from "./components/PersonDetailsDialog";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { toast } from "sonner";
import { genreService, movieService, personService, userService } from "./services/api";
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
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonDialogOpen, setIsPersonDialogOpen] = useState(false);
  const [favoriteMoviesList, setFavoriteMoviesList] = useState<Movie[]>([]);
  const [favoritePersonsList, setFavoritePersonsList] = useState<Person[]>([]);
  const [favoriteGenresList, setFavoriteGenresList] = useState<Genre[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  
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

  const favoritePersonIds = useMemo(
    () => favoritePersonsList.map((p) => p.id),
    [favoritePersonsList]
  );

  // Подтягиваем жанры и избранное, когда пользователь авторизован
  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteMoviesList([]);
      setFavoritePersonsList([]);
      setFavoriteGenresList([]);
      return;
    }
    refetchGenres();
    let cancelled = false;
    setFavoritesLoading(true);
    Promise.all([
      userService.getFavorites("me").catch(() => [] as Movie[]),
      personService.getFavorites().catch(() => [] as Person[]),
      genreService.getFavorites().catch(() => [] as Genre[]),
    ])
      .then(([movies, persons, genres]) => {
        if (cancelled) return;
        setFavoriteMoviesList(movies);
        setFavoritePersonsList(persons);
        setFavoriteGenresList(genres);
        updateUserProfile({
          favoriteMovies: movies.map((m) => m.id),
          favoriteActors: persons.map((p) => p.name_ru || p.name_en || `ID ${p.id}`),
          favoriteGenres: genres.map((g) => g.name),
        });
      })
      .finally(() => {
        if (!cancelled) setFavoritesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refetchGenres, updateUserProfile]);

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

  const handleMovieClick = async (movie: Movie) => {
    try {
      const [details, genres] = await Promise.all([
        movieService.getFilmDetails(movie.id),
        movieService.getFilmGenres(movie.id).catch(() => [] as Genre[]),
      ]);
      setSelectedMovie({ ...details, genres: genres.length ? genres : movie.genres });
    } catch {
      setSelectedMovie(movie);
    }
    setIsMovieDialogOpen(true);
  };

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setIsPersonDialogOpen(true);
  };

  const handleAddPersonFavorite = async (person: Person) => {
    if (!isAuthenticated) {
      toast.error("Пожалуйста, войдите в систему");
      return;
    }
    if (favoritePersonsList.some((p) => p.id === person.id)) return;

    const previous = favoritePersonsList;
    setFavoritePersonsList((prev) => [...prev, person]);
    updateUserProfile({
      favoriteActors: [...previous, person].map(
        (p) => p.name_ru || p.name_en || `ID ${p.id}`
      ),
    });
    try {
      await personService.addFavorite(person.id);
      toast.success("Добавлено в избранные персоны");
    } catch (e) {
      console.error(e);
      setFavoritePersonsList(previous);
      updateUserProfile({
        favoriteActors: previous.map((p) => p.name_ru || p.name_en || `ID ${p.id}`),
      });
      toast.error("Не удалось добавить актёра в избранное");
    }
  };

  const handleRemovePersonFavorite = async (person: Person) => {
    if (!isAuthenticated) return;
    const previous = favoritePersonsList;
    setFavoritePersonsList((prev) => prev.filter((p) => p.id !== person.id));
    updateUserProfile({
      favoriteActors: previous
        .filter((p) => p.id !== person.id)
        .map((p) => p.name_ru || p.name_en || `ID ${p.id}`),
    });
    try {
      await personService.removeFavorite(person.id);
      toast.success("Удалено из избранных персон");
    } catch (e) {
      console.error(e);
      setFavoritePersonsList(previous);
      updateUserProfile({
        favoriteActors: previous.map((p) => p.name_ru || p.name_en || `ID ${p.id}`),
      });
      toast.error("Не удалось удалить актёра из избранного");
    }
  };

  const handleTogglePersonFavorite = async () => {
    if (!selectedPerson || !isAuthenticated) return;
    if (favoritePersonIds.includes(selectedPerson.id)) {
      await handleRemovePersonFavorite(selectedPerson);
    } else {
      await handleAddPersonFavorite(selectedPerson);
    }
  };

  const handleToggleFavorite = async (movie?: Movie | null) => {
    const target = movie ?? selectedMovie;
    if (!target || !isAuthenticated) {
      toast.error("Пожалуйста, войдите в систему");
      return;
    }

    const isFav = favoriteMoviesList.some((m) => m.id === target.id);
    const previous = favoriteMoviesList;
    const nextList = isFav
      ? previous.filter((m) => m.id !== target.id)
      : [target, ...previous.filter((m) => m.id !== target.id)];

    setFavoriteMoviesList(nextList);
    updateUserProfile({ favoriteMovies: nextList.map((m) => m.id) });

    try {
      await userService.toggleFavorite("me", target.id, isFav ? "remove" : "add");
      toast.success(isFav ? "Удалено из избранного" : "Добавлено в избранное");
    } catch (e) {
      setFavoriteMoviesList(previous);
      updateUserProfile({ favoriteMovies: previous.map((m) => m.id) });
      toast.error("Не удалось обновить избранное");
      console.error(e);
    }
  };

  const handleAddGenre = async (genre: Genre) => {
    if (!isAuthenticated) return;
    if (favoriteGenresList.some((g) => g.id === genre.id)) return;
    const previous = favoriteGenresList;
    const nextList = [...previous, genre].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    setFavoriteGenresList(nextList);
    updateUserProfile({ favoriteGenres: nextList.map((g) => g.name) });
    try {
      await genreService.addFavorite(genre.id);
      toast.success("Жанр добавлен в любимые");
    } catch (e) {
      console.error(e);
      setFavoriteGenresList(previous);
      updateUserProfile({ favoriteGenres: previous.map((g) => g.name) });
      toast.error("Не удалось добавить жанр");
    }
  };

  const handleRemoveGenre = async (genre: Genre) => {
    if (!isAuthenticated) return;
    const previous = favoriteGenresList;
    const nextList = previous.filter((g) => g.id !== genre.id && g.name !== genre.name);
    setFavoriteGenresList(nextList);
    updateUserProfile({ favoriteGenres: nextList.map((g) => g.name) });
    try {
      await genreService.removeFavorite(genre.id);
      toast.success("Жанр удалён из любимых");
    } catch (e) {
      console.error(e);
      setFavoriteGenresList(previous);
      updateUserProfile({ favoriteGenres: previous.map((g) => g.name) });
      toast.error("Не удалось удалить жанр");
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
    ? favoriteMoviesList.some((m) => m.id === selectedMovie.id)
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
        avatarUrl={user?.avatar_url}
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
              onPersonClick={handlePersonClick}
              onBack={() => setCurrentView("catalog")}
              allGenres={allGenres}
              favoriteMovies={favoriteMoviesList}
              favoritePersons={favoritePersonsList}
              favoriteGenres={favoriteGenresList}
              favoritesLoading={favoritesLoading}
              onToggleMovieFavorite={(movie) => handleToggleFavorite(movie)}
              onAddPersonFavorite={handleAddPersonFavorite}
              onRemovePersonFavorite={handleRemovePersonFavorite}
              onAddGenre={handleAddGenre}
              onRemoveGenre={handleRemoveGenre}
            />
          )}
        </>
      )}

      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onMovieClick={handleMovieClick}
        onPersonClick={handlePersonClick}
      />

      <MovieDetailsDialog
        movie={selectedMovie}
        open={isMovieDialogOpen}
        onOpenChange={setIsMovieDialogOpen}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        onOpenMovie={handleMovieClick}
      />

      <PersonDetailsDialog
        person={selectedPerson}
        open={isPersonDialogOpen}
        onOpenChange={setIsPersonDialogOpen}
        isFavorite={selectedPerson ? favoritePersonIds.includes(selectedPerson.id) : false}
        onToggleFavorite={handleTogglePersonFavorite}
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
