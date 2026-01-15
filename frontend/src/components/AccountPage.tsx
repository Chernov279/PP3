import { useState, useEffect } from "react";
import { ArrowLeft, Settings, Heart, Eye, Link as LinkIcon, Trash2, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { UserProfile, Movie } from "../types/api";
import { movieApi } from "../services/movieApi";
import { toast } from "sonner";

interface AccountPageProps {
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onMovieClick: (movie: Movie) => void;
  onBack: () => void;
}

export function AccountPage({
  profile,
  onUpdateProfile,
  onMovieClick,
  onBack,
}: AccountPageProps) {
  const [activeTab, setActiveTab] = useState("favorites");
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newActor, setNewActor] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [isAddActorOpen, setIsAddActorOpen] = useState(false);

  // Загружаем фильмы для вкладок
  useEffect(() => {
    const loadMovies = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "favorites" && profile.favorite_movies.length > 0) {
          const movies = await movieApi.getMoviesByIds(profile.favorite_movies);
          setFavoriteMovies(movies);
        } else if (activeTab === "watched" && profile.watched_movies.length > 0) {
          const movies = await movieApi.getMoviesByIds(profile.watched_movies);
          setWatchedMovies(movies);
        } else if (activeTab === "favorites") {
          setFavoriteMovies([]);
        } else if (activeTab === "watched") {
          setWatchedMovies([]);
        }
      } catch (error) {
        console.error('Failed to load movies:', error);
        toast.error('Ошибка загрузки фильмов');
      } finally {
        setIsLoading(false);
      }
    };

    loadMovies();
  }, [activeTab, profile.favorite_movies, profile.watched_movies]);

  const handleRemoveFavorite = async (movieId: number) => {
    try {
      await movieApi.toggleFavorite(movieId);
      
      const updatedFavorites = profile.favorite_movies.filter(id => id !== movieId);
      await onUpdateProfile({ favorite_movies: updatedFavorites });
      
      setFavoriteMovies(prev => prev.filter(movie => movie.id !== movieId));
      toast.success('Удалено из избранного');
    } catch (error) {
      toast.error('Ошибка удаления из избранного');
    }
  };

  const handleRemoveWatched = async (movieId: number) => {
    try {
      const updatedWatched = profile.watched_movies.filter(id => id !== movieId);
      await onUpdateProfile({ watched_movies: updatedWatched });
      
      setWatchedMovies(prev => prev.filter(movie => movie.id !== movieId));
      toast.success('Удалено из истории просмотров');
    } catch (error) {
      toast.error('Ошибка удаления');
    }
  };

  const handleAddGenre = async () => {
    if (newGenre.trim() && !profile.favorite_genres.includes(newGenre.trim())) {
      try {
        const updatedGenres = [...profile.favorite_genres, newGenre.trim()];
        await onUpdateProfile({ favorite_genres: updatedGenres });
        setNewGenre("");
        toast.success('Жанр добавлен');
      } catch (error) {
        toast.error('Ошибка добавления жанра');
      }
    }
  };

  const handleRemoveGenre = async (genre: string) => {
    try {
      const updatedGenres = profile.favorite_genres.filter(g => g !== genre);
      await onUpdateProfile({ favorite_genres: updatedGenres });
      toast.success('Жанр удален');
    } catch (error) {
      toast.error('Ошибка удаления жанра');
    }
  };

  const handleAddActor = async () => {
    if (newActor.trim() && !profile.favorite_actors.includes(newActor.trim())) {
      try {
        const updatedActors = [...profile.favorite_actors, newActor.trim()];
        await onUpdateProfile({ favorite_actors: updatedActors });
        setNewActor("");
        setIsAddActorOpen(false);
        toast.success('Актер добавлен');
      } catch (error) {
        toast.error('Ошибка добавления актера');
      }
    }
  };

  const handleRemoveActor = async (actor: string) => {
    try {
      const updatedActors = profile.favorite_actors.filter(a => a !== actor);
      await onUpdateProfile({ favorite_actors: updatedActors });
      toast.success('Актер удален');
    } catch (error) {
      toast.error('Ошибка удаления актера');
    }
  };

  const handleToggleConnection = async (platform: "imdb" | "kinopoisk") => {
    try {
      await onUpdateProfile({
        [platform === "imdb" ? "imdb_connected" : "kinopoisk_connected"]:
          !profile[platform === "imdb" ? "imdb_connected" : "kinopoisk_connected"],
      });
      toast.success(platform === "imdb" ? "IMDb подключен" : "Кинопоиск подключен");
    } catch (error) {
      toast.error('Ошибка обновления подключения');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Мой аккаунт</h1>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к рекомендациям
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="connections">
              <LinkIcon className="h-4 w-4 mr-2" />
              Подключения
            </TabsTrigger>
            <TabsTrigger value="watched">
              <Eye className="h-4 w-4 mr-2" />
              Просмотрено
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="h-4 w-4 mr-2" />
              Избранное
            </TabsTrigger>
            <TabsTrigger value="genres">Жанры</TabsTrigger>
            <TabsTrigger value="actors">Актёры</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Подключение к платформам</CardTitle>
                <CardDescription>
                  Подключите свои аккаунты для сбора просмотренных фильмов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="font-bold text-white">IMDb</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">IMDb</h4>
                      <p className="text-muted-foreground">
                        {profile.imdb_connected ? "Подключено" : "Не подключено"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={profile.imdb_connected ? "outline" : "default"}
                    onClick={() => handleToggleConnection("imdb")}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {profile.imdb_connected ? "Отключить" : "Подключить"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-md flex items-center justify-center">
                      <span className="font-bold text-white">КП</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Кинопоиск</h4>
                      <p className="text-muted-foreground">
                        {profile.kinopoisk_connected ? "Подключено" : "Не подключено"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={profile.kinopoisk_connected ? "outline" : "default"}
                    onClick={() => handleToggleConnection("kinopoisk")}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {profile.kinopoisk_connected ? "Отключить" : "Подключить"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watched">
            <Card>
              <CardHeader>
                <CardTitle>Просмотренные фильмы</CardTitle>
                <CardDescription>
                  Всего просмотрено: {watchedMovies.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Загрузка...</div>
                ) : watchedMovies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {watchedMovies.map((movie) => (
                      <div key={movie.id} className="group relative">
                        <div
                          className="cursor-pointer"
                          onClick={() => onMovieClick(movie)}
                        >
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-full h-64 object-cover rounded-lg mb-2"
                          />
                          <h3 className="font-semibold truncate">{movie.title}</h3>
                          <p className="text-sm text-muted-foreground">{movie.year}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveWatched(movie.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет просмотренных фильмов
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
                  Всего в избранном: {favoriteMovies.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Загрузка...</div>
                ) : favoriteMovies.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {favoriteMovies.map((movie) => (
                      <div key={movie.id} className="group relative">
                        <div
                          className="cursor-pointer"
                          onClick={() => onMovieClick(movie)}
                        >
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-full h-64 object-cover rounded-lg mb-2"
                          />
                          <h3 className="font-semibold truncate">{movie.title}</h3>
                          <p className="text-sm text-muted-foreground">{movie.year}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFavorite(movie.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет избранных фильмов
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
                  <h4 className="mb-3 font-semibold">Выбранные жанры</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.favorite_genres.map((genre) => (
                      <Badge key={genre} variant="default" className="gap-2">
                        {genre}
                        <button
                          onClick={() => handleRemoveGenre(genre)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {profile.favorite_genres.length === 0 && (
                      <p className="text-muted-foreground">Жанры не выбраны</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 font-semibold">Добавить жанр</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите название жанра"
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddGenre();
                        }
                      }}
                    />
                    <Button onClick={handleAddGenre}>
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить
                    </Button>
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
                <Dialog open={isAddActorOpen} onOpenChange={setIsAddActorOpen}>
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
                        onChange={(e) => setNewActor(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddActor();
                          }
                        }}
                      />
                      <Button onClick={handleAddActor} className="w-full">
                        Добавить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex flex-wrap gap-2">
                  {profile.favorite_actors.map((actor) => (
                    <Badge key={actor} variant="secondary" className="gap-2">
                      {actor}
                      <button
                        onClick={() => handleRemoveActor(actor)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {profile.favorite_actors.length === 0 && (
                    <p className="text-muted-foreground">Актёры не добавлены</p>
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