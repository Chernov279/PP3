import { useState, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { Plus, Trash2, Link as LinkIcon, Loader2 } from "lucide-react";
import { Genre, Movie, Person, UserProfile } from "../types/movie";
import { MovieCard } from "./MovieCard";
import { PersonCard } from "./PersonCard";
import { ProfileAvatar } from "./ProfileAvatar";
import { useAuth } from "../contexts/AuthContext";
import { userService, movieService, personService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { toast } from "sonner";

interface AccountPageProps {
  profile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onMovieClick: (movie: Movie) => void;
  onPersonClick: (person: Person) => void;
  onBack: () => void;
  allGenres: Genre[];
  favoriteMovies: Movie[];
  favoritePersons: Person[];
  favoriteGenres: Genre[];
  favoritesLoading?: boolean;
  onToggleMovieFavorite: (movie: Movie) => void;
  onAddPersonFavorite: (person: Person) => void;
  onRemovePersonFavorite: (person: Person) => void;
  onAddGenre: (genre: Genre) => void;
  onRemoveGenre: (genre: Genre) => void;
}

export function AccountPage({
  profile,
  onUpdateProfile,
  onMovieClick,
  onPersonClick,
  onBack,
  allGenres,
  favoriteMovies,
  favoritePersons,
  favoriteGenres,
  favoritesLoading = false,
  onToggleMovieFavorite,
  onAddPersonFavorite,
  onRemovePersonFavorite,
  onAddGenre,
  onRemoveGenre,
}: AccountPageProps) {
  const { user, updateAvatar } = useAuth();
  const [newActor, setNewActor] = useState("");
  const [isSearchingActor, setIsSearchingActor] = useState(false);
  const [actorSuggestions, setActorSuggestions] = useState<Person[]>([]);

  const [isKinopoiskDialogOpen, setIsKinopoiskDialogOpen] = useState(false);
  const [kinopoiskIdInput, setKinopoiskIdInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchWatched = useCallback(() => {
    if (!user?.id) return Promise.resolve([]);
    return userService.getWatched(user.id);
  }, [user?.id]);

  const { data: watchedMovies, loading: watchedLoading } = useApi(
    fetchWatched,
    { immediate: !!user?.id }
  );

  const uniqueWatchedMovies = useMemo(() => {
    const seen = new Set<number>();
    return (watchedMovies || []).filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });
  }, [watchedMovies]);

  const uniqueFavoriteMovies = useMemo(() => {
    const seen = new Set<number>();
    return favoriteMovies.filter((movie) => {
      if (seen.has(movie.id)) return false;
      seen.add(movie.id);
      return true;
    });
  }, [favoriteMovies]);

  const favoriteGenreIds = useMemo(
    () => new Set(favoriteGenres.map((g) => g.id)),
    [favoriteGenres]
  );

  const availableGenres = useMemo(
    () => allGenres.filter((g) => !favoriteGenreIds.has(g.id)),
    [allGenres, favoriteGenreIds]
  );

  const handleSearchActors = useCallback(async (query: string) => {
    if (!query.trim()) {
      setActorSuggestions([]);
      return;
    }
    setIsSearchingActor(true);
    try {
      const results = await personService.search(query.trim(), 1);
      setActorSuggestions(results.slice(0, 3));
    } catch (e) {
      console.error(e);
      setActorSuggestions([]);
    } finally {
      setIsSearchingActor(false);
    }
  }, []);

  const handleSelectActor = async (person: Person) => {
    await onAddPersonFavorite(person);
    setNewActor("");
    setActorSuggestions([]);
  };

  const handleToggleConnection = (
    platform: "imdb" | "kinopoisk",
  ) => {
    onUpdateProfile({
      [platform === "imdb"
        ? "imdbConnected"
        : "is_kinopoisk_synchronized"]:
        platform === "imdb"
          ? !profile.imdbConnected
          : !profile.is_kinopoisk_synchronized,
    });
  };

  const handleSyncKinopoisk = async () => {
    if (!kinopoiskIdInput.trim()) return;
    setIsSyncing(true);
    try {
      await movieService.syncKinopoiskWatchHistory(Number(kinopoiskIdInput));
      onUpdateProfile({
        is_kinopoisk_synchronized: true,
      });
      setIsKinopoiskDialogOpen(false);
      setKinopoiskIdInput("");
      toast.success("Кинопоиск успешно подключен, история синхронизирована");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Ошибка при подключении Кинопоиска");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          {user && (
            <div className="mb-6">
              <ProfileAvatar
                name={user.name}
                avatarUrl={user.avatar_url}
                onAvatarChange={updateAvatar}
              />
            </div>
          )}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1>Мой аккаунт</h1>
              {user && (
                <p className="text-muted-foreground mt-1">
                  {user.name} • {user.email}
                </p>
              )}
            </div>
            <Button variant="outline" className="mt-1 shrink-0" onClick={onBack}>
              Назад к рекомендациям
            </Button>
          </div>
        </div>

        <Tabs defaultValue="connections" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="connections">
              Подключения
            </TabsTrigger>
            <TabsTrigger value="watched">
              Просмотрено
            </TabsTrigger>
            <TabsTrigger value="favorites">
              Избранное
            </TabsTrigger>
            <TabsTrigger value="genres">Жанры</TabsTrigger>
            <TabsTrigger value="actors">Актёры</TabsTrigger>
          </TabsList>

          <TabsContent
            value="connections"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Подключение к платформам</CardTitle>
                <CardDescription>
                  Подключите свои аккаунты для сбора
                  просмотренных фильмов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span>IMDb</span>
                    </div>
                    <div>
                      <h4>IMDb</h4>
                      <p className="text-muted-foreground">
                        {profile.imdbConnected
                          ? "Подключено"
                          : "Не подключено"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={
                      profile.imdbConnected
                        ? "outline"
                        : "default"
                    }
                    onClick={() =>
                      handleToggleConnection("imdb")
                    }
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {profile.imdbConnected
                      ? "Отключить"
                      : "Подключить"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-md flex items-center justify-center">
                      <span>КП</span>
                    </div>
                    <div>
                      <h4>Кинопоиск</h4>
                      <p className="text-muted-foreground">
                        {profile.is_kinopoisk_synchronized
                          ? "Подключено"
                          : "Не подключено"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={
                      profile.is_kinopoisk_synchronized
                        ? "outline"
                        : "default"
                    }
                    onClick={() => {
                      if (profile.is_kinopoisk_synchronized) {
                        handleToggleConnection("kinopoisk");
                      } else {
                        setIsKinopoiskDialogOpen(true);
                      }
                    }}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {profile.is_kinopoisk_synchronized
                      ? "Отключить"
                      : "Подключить"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dialog for Kinopoisk */}
            <Dialog open={isKinopoiskDialogOpen} onOpenChange={setIsKinopoiskDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Подключение Кинопоиска</DialogTitle>
                  <DialogDescription>
                    Введите ваш ID с сайта Кинопоиск (только цифры), чтобы синхронизировать историю просмотров.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="kp-id">Кинопоиск ID</Label>
                    <Input
                      id="kp-id"
                      type="number"
                      placeholder="Например: 1234567"
                      value={kinopoiskIdInput}
                      onChange={(e) => setKinopoiskIdInput(e.target.value)}
                      disabled={isSyncing}
                    />
                  </div>
                  <Button 
                    onClick={handleSyncKinopoisk} 
                    className="w-full"
                    disabled={!kinopoiskIdInput.trim() || isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Синхронизация...
                      </>
                    ) : (
                      "Подключить и синхронизировать"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="watched">
            <Card>
              <CardHeader>
                <CardTitle>Просмотренные фильмы</CardTitle>
                <CardDescription>
                  Всего просмотрено: {uniqueWatchedMovies.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {watchedLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uniqueWatchedMovies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => onMovieClick(movie)}
                      />
                    ))}
                    {(watchedMovies || []).length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        Нет просмотренных фильмов
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Избранные фильмы</CardTitle>
                <CardDescription>
                  Всего в избранном: {uniqueFavoriteMovies.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uniqueFavoriteMovies.map((movie) => (
                      <div key={movie.id} className="relative group">
                        <MovieCard
                          movie={movie}
                          onClick={() => onMovieClick(movie)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMovieFavorite(movie);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {uniqueFavoriteMovies.length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        Нет избранных фильмов
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="genres">
            <Card>
              <CardHeader>
                <CardTitle>Любимые жанры</CardTitle>
                <CardDescription>
                  Управляйте списком любимых жанров
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {favoriteGenres.map((genre) => (
                      <Badge
                        key={genre.id}
                        variant="default"
                        className="gap-2"
                      >
                        {genre.name}
                        <button
                          type="button"
                          onClick={() => onRemoveGenre(genre)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {favoriteGenres.length === 0 && (
                      <p className="text-muted-foreground">
                        Любимых жанров пока нет
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3">Добавить жанр</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map((genre) => (
                        <Button
                          key={genre.id}
                          variant="outline"
                          size="sm"
                          onClick={() => onAddGenre(genre)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {genre.name}
                        </Button>
                      ))}
                    {availableGenres.length === 0 && allGenres.length === 0 && (
                      <p className="text-muted-foreground">Список жанров недоступен</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actors">
            <Card>
              <CardHeader>
                <CardTitle>Любимые актёры</CardTitle>
                <CardDescription>
                  Управление списком любимых актёров
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="Начните вводить имя актёра"
                      value={newActor}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewActor(value);
                        handleSearchActors(value);
                      }}
                    />
                    {isSearchingActor && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Поиск актёров...
                      </div>
                    )}
                    {actorSuggestions.filter(
                      (person) => !favoritePersons.some((p) => p.id === person.id)
                    ).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {actorSuggestions
                          .filter((person) => !favoritePersons.some((p) => p.id === person.id))
                          .map((person) => (
                            <PersonCard
                              key={person.id}
                              person={person}
                              compact
                              onClick={() => handleSelectActor(person)}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {favoritePersons.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {favoritePersons.map((person) => (
                      <div key={person.id} className="relative group">
                        <PersonCard
                          person={person}
                          onClick={() => onPersonClick(person)}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePersonFavorite(person);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Актёры не добавлены</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}