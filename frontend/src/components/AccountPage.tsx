import { useState } from "react";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { UserProfile, Movie } from "../types/movie";
import { allGenres } from "../data/mockData";
import { MovieCard } from "./MovieCard";

interface AccountPageProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onBack: () => void;
}

export function AccountPage({
  profile,
  onUpdateProfile,
  movies,
  onMovieClick,
  onBack,
}: AccountPageProps) {
  const [newActor, setNewActor] = useState("");
  const [isAddActorOpen, setIsAddActorOpen] = useState(false);

  const watchedMovies = movies.filter((m) =>
    profile.watchedMovies.includes(m.id),
  );
  const favoriteMovies = movies.filter((m) =>
    profile.favoriteMovies.includes(m.id),
  );

  const handleAddGenre = (genre: string) => {
    if (!profile.favoriteGenres.includes(genre)) {
      onUpdateProfile({
        ...profile,
        favoriteGenres: [...profile.favoriteGenres, genre],
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
    if (
      newActor.trim() &&
      !profile.favoriteActors.includes(newActor.trim())
    ) {
      onUpdateProfile({
        ...profile,
        favoriteActors: [
          ...profile.favoriteActors,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1>Мой аккаунт</h1>
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
                    onClick={() =>
                      handleToggleConnection("kinopoisk")
                    }
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {profile.kinopoiskConnected
                      ? "Отключить"
                      : "Подключить"}
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {watchedMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => onMovieClick(movie)}
                    />
                  ))}
                  {watchedMovies.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Нет просмотренных фильмов
                    </div>
                  )}
                </div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favoriteMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => onMovieClick(movie)}
                    />
                  ))}
                  {favoriteMovies.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Нет избранных фильмов
                    </div>
                  )}
                </div>
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
                    {profile.favoriteGenres.map((genre) => (
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
                    {profile.favoriteGenres.length === 0 && (
                      <p className="text-muted-foreground">
                        Жанры не выбраны
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3">Добавить жанр</h4>
                  <div className="flex flex-wrap gap-2">
                    {allGenres
                      .filter(
                        (g) =>
                          !profile.favoriteGenres.includes(g),
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
                  {profile.favoriteActors.map((actor) => (
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
                  {profile.favoriteActors.length === 0 && (
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