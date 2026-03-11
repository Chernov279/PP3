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
  DialogTrigger,
} from "./ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import { ArrowLeft, Film, Star, Heart, Plus, Trash2, Link as LinkIcon, Loader2 } from "lucide-react";
import { Movie, UserProfile } from "../types/movie";
import { MovieCard } from "./MovieCard";
import { useAuth } from "../contexts/AuthContext";
import { userService, movieService } from "../services/api";
import { useApi } from "../hooks/useApi";
import { toast } from "sonner";

interface AccountPageProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onMovieClick: (movie: Movie) => void;
  onBack: () => void;
}

export function AccountPage({
  profile,
  onUpdateProfile,
  onMovieClick,
  onBack,
}: AccountPageProps) {
  const { user } = useAuth();
  const [newActor, setNewActor] = useState("");
  const [isAddActorOpen, setIsAddActorOpen] = useState(false);

  // States for Kinopoisk Sync Dialog
  const [isKinopoiskDialogOpen, setIsKinopoiskDialogOpen] = useState(false);
  const [kinopoiskIdInput, setKinopoiskIdInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Memoize API calls to avoid unneeded re-renders/fetches
  const fetchWatched = useCallback(() => {
    if (!user?.id) return Promise.resolve([]);
    return userService.getWatched(user.id);
  }, [user?.id]);

  const fetchFavorites = useCallback(() => userService.getFavorites("me"), []);
  const fetchAllGenres = useCallback(() => movieService.getAllGenres(), []);

  // Fetch data
  const { data: watchedMovies, loading: watchedLoading } = useApi(
    fetchWatched,
    { immediate: !!user?.id }
  );

  const { data: favoriteMovies, loading: favoritesLoading } = useApi(
    fetchFavorites,
    { immediate: true }
  );
  
  const { data: allGenresRaw } = useApi(fetchAllGenres, { immediate: true });
  const allGenres = useMemo(() => allGenresRaw?.map(g => g.name) || [], [allGenresRaw]);

  const handleAddGenre = (genre: string) => {
    const currentGenres = profile.favoriteGenres || [];
    if (!currentGenres.includes(genre)) {
      onUpdateProfile({
        ...profile,
        favoriteGenres: [...currentGenres, genre],
      });
    }
  };

  const handleRemoveGenre = (genre: string) => {
    onUpdateProfile({
      ...profile,
      favoriteGenres: profile.favoriteGenres.filter(
        (g) => g !== genre,
      ),
    });
  };

  const handleAddActor = () => {
    const currentActors = profile.favoriteActors || [];
    if (
      newActor.trim() &&
      !currentActors.includes(newActor.trim())
    ) {
      onUpdateProfile({
        ...profile,
        favoriteActors: [
          ...currentActors,
          newActor.trim(),
        ],
      });
      setNewActor("");
      setIsAddActorOpen(false);
    }
  };

  const handleRemoveActor = (actor: string) => {
    onUpdateProfile({
      ...profile,
      favoriteActors: profile.favoriteActors.filter(
        (a) => a !== actor,
      ),
    });
  };

  const handleToggleConnection = (
    platform: "imdb" | "kinopoisk",
  ) => {
    onUpdateProfile({
      ...profile,
      [platform === "imdb"
        ? "imdbConnected"
        : "kinopoiskConnected"]:
        platform === "imdb"
          ? !profile.imdbConnected
          : !profile.kinopoiskConnected,
    });
  };

  const handleSyncKinopoisk = async () => {
    if (!kinopoiskIdInput.trim()) return;
    setIsSyncing(true);
    try {
      await movieService.syncKinopoiskWatchHistory(Number(kinopoiskIdInput));
      onUpdateProfile({
        ...profile,
        kinopoiskConnected: true,
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1>Мой аккаунт</h1>
            {user && (
              <p className="text-muted-foreground mt-1">
                {user.name} • {user.email}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={onBack}>
            Назад к рекомендациям
          </Button>
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
                        {profile.kinopoiskConnected
                          ? "Подключено"
                          : "Не подключено"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={
                      profile.kinopoiskConnected
                        ? "outline"
                        : "default"
                    }
                    onClick={() => {
                      if (profile.kinopoiskConnected) {
                        handleToggleConnection("kinopoisk");
                      } else {
                        setIsKinopoiskDialogOpen(true);
                      }
                    }}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {profile.kinopoiskConnected
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
                  Всего просмотрено: {(watchedMovies || []).length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {watchedLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(watchedMovies || []).map((movie) => (
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
                  Всего в избранном: {(favoriteMovies || []).length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(favoriteMovies || []).map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => onMovieClick(movie)}
                      />
                    ))}
                    {(favoriteMovies || []).length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        Избранное временно недоступно
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
                  Выберите жанры, которые вам нравятся
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="mb-3">Выбранные жанры</h4>
                  <div className="flex flex-wrap gap-2">
                    {(profile.favoriteGenres || []).map((genre) => (
                      <Badge
                        key={genre}
                        variant="default"
                        className="gap-2"
                      >
                        {genre}
                        <button
                          onClick={() =>
                            handleRemoveGenre(genre)
                          }
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {(profile.favoriteGenres || []).length === 0 && (
                      <p className="text-muted-foreground">
                        Жанры не выбраны
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3">Добавить жанр</h4>
                  <div className="flex flex-wrap gap-2">
                    {(allGenres || [])
                      .filter(
                        (g) =>
                          !(profile.favoriteGenres || []).includes(g),
                      )
                      .map((genre) => (
                        <Button
                          key={genre}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddGenre(genre)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {genre}
                        </Button>
                      ))}
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
                <Dialog
                  open={isAddActorOpen}
                  onOpenChange={setIsAddActorOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить актёра
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить актёра</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Введите имя актёра"
                        value={newActor}
                        onChange={(e) =>
                          setNewActor(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddActor();
                          }
                        }}
                      />
                      <Button
                        onClick={handleAddActor}
                        className="w-full"
                      >
                        Добавить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex flex-wrap gap-2">
                  {(profile.favoriteActors || []).map((actor) => (
                     <Badge
                      key={actor}
                      variant="secondary"
                      className="gap-2"
                    >
                      {actor}
                      <button
                        onClick={() => handleRemoveActor(actor)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {(profile.favoriteActors || []).length === 0 && (
                    <p className="text-muted-foreground">
                      Актёры не добавлены
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}