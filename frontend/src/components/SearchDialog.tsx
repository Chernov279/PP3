import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Movie, Person } from "../types/movie";
import { Collection } from "../types/collection";
import { MovieCard } from "./MovieCard";
import { PersonCard } from "./PersonCard";
import { CollectionCard } from "./CollectionCard";
import { useMutation } from "../hooks/useApi";
import { collectionService, movieService, personService } from "../services/api";

type SearchTab = "films" | "persons" | "collections";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieClick: (movie: Movie) => void;
  onPersonClick: (person: Person) => void;
  onCollectionClick?: (collection: Collection) => void;
}

export function SearchDialog({
  open,
  onOpenChange,
  onMovieClick,
  onPersonClick,
  onCollectionClick,
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("films");

  const { data: filmResults, loading: filmsLoading, mutate: searchFilms } =
    useMutation(movieService.searchFilms);
  const { data: personResults, loading: personsLoading, mutate: searchPersons } =
    useMutation(personService.search);
  const { data: collectionPage, loading: collectionsLoading, mutate: searchCollections } =
    useMutation(async (query: string) => collectionService.search(query, 1, 20, true));

  const runSearch = (query: string, nextTab: SearchTab) => {
    const trimmed = query.trim();
    if (trimmed.length <= 2) return;
    if (nextTab === "films") searchFilms(trimmed);
    else if (nextTab === "persons") searchPersons(trimmed, 1);
    else searchCollections(trimmed);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    runSearch(query, tab);
  };

  const handleTabChange = (value: string) => {
    const next = value as SearchTab;
    setTab(next);
    runSearch(searchQuery, next);
  };

  const loading =
    tab === "films" ? filmsLoading : tab === "persons" ? personsLoading : collectionsLoading;
  const collectionResults = collectionPage?.items || [];
  const hasEmptyResults =
    tab === "films"
      ? Boolean(filmResults && filmResults.length === 0)
      : tab === "persons"
        ? Boolean(personResults && personResults.length === 0)
        : Boolean(collectionPage && collectionResults.length === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col scrollbar-hidden">
        <DialogHeader>
          <DialogTitle>Поиск</DialogTitle>
          <DialogDescription>
            Фильмы, персоны и публичные коллекции
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="films">Фильмы</TabsTrigger>
            <TabsTrigger value="persons">Персоны</TabsTrigger>
            <TabsTrigger value="collections">Коллекции</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="space-y-4 mt-4 min-h-0 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={
                  tab === "films"
                    ? "Введите название фильма..."
                    : tab === "persons"
                      ? "Введите имя актёра или режиссёра..."
                      : "Найдите публичную коллекцию..."
                }
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto max-h-[60vh] pr-1 scrollbar-hidden">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Поиск...</span>
                </div>
              )}

              {!loading && tab === "films" && filmResults && filmResults.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {filmResults.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      compact
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
                <div className="grid grid-cols-2 gap-4">
                  {personResults.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      compact
                      onClick={() => {
                        onPersonClick(person);
                        onOpenChange(false);
                        setSearchQuery("");
                      }}
                    />
                  ))}
                </div>
              )}

              {!loading && tab === "collections" && collectionResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {collectionResults.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      onClick={() => {
                        onCollectionClick?.(collection);
                        onOpenChange(false);
                        setSearchQuery("");
                      }}
                    />
                  ))}
                </div>
              )}

              {!loading && searchQuery.length > 2 && hasEmptyResults && (
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
