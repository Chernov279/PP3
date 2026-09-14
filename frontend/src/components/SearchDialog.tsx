import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Movie, Person } from "../types/movie";
import { MovieCard } from "./MovieCard";
import { PersonCard } from "./PersonCard";
import { useMutation } from "../hooks/useApi";
import { movieService, personService } from "../services/api";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieClick: (movie: Movie) => void;
  onPersonClick: (person: Person) => void;
}

export function SearchDialog({
  open,
  onOpenChange,
  onMovieClick,
  onPersonClick,
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"films" | "persons">("films");

  const { data: filmResults, loading: filmsLoading, mutate: searchFilms } =
    useMutation(movieService.searchFilms);
  const { data: personResults, loading: personsLoading, mutate: searchPersons } =
    useMutation(personService.search);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const trimmed = query.trim();
    if (trimmed.length <= 2) return;
    if (tab === "films") {
      searchFilms(trimmed);
    } else {
      searchPersons(trimmed, 1);
    }
  };

  const handleTabChange = (value: string) => {
    const next = value as "films" | "persons";
    setTab(next);
    const trimmed = searchQuery.trim();
    if (trimmed.length > 2) {
      if (next === "films") searchFilms(trimmed);
      else searchPersons(trimmed, 1);
    }
  };

  const loading = tab === "films" ? filmsLoading : personsLoading;
  const results = tab === "films" ? filmResults : personResults;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Поиск</DialogTitle>
          <DialogDescription>
            Фильмы и персоны через API КиноРек
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="films">Фильмы</TabsTrigger>
            <TabsTrigger value="persons">Актёры и режиссёры</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={
                  tab === "films"
                    ? "Введите название фильма..."
                    : "Введите имя актёра или режиссёра..."
                }
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Поиск...</span>
                </div>
              )}

              {!loading && tab === "films" && filmResults && filmResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filmResults.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => {
                        onMovieClick(movie);
                        onOpenChange(false);
                        setSearchQuery("");
                      }}
                    />
                  ))}
                </div>
              )}

              {!loading && tab === "persons" && personResults && personResults.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {personResults.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      onClick={() => {
                        onPersonClick(person);
                        onOpenChange(false);
                        setSearchQuery("");
                      }}
                    />
                  ))}
                </div>
              )}

              {!loading && searchQuery.length > 2 && results && results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Ничего не найдено по запросу «{searchQuery}»
                </div>
              )}

              {!searchQuery && (
                <div className="text-center py-8 text-muted-foreground">
                  Начните вводить запрос (минимум 3 символа)
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
