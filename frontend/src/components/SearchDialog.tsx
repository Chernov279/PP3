import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Movie } from "../types/api";
import { MovieCard } from "./MovieCard";
import { movieApi } from "../services/movieAPI";

type SearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieClick: (movie: Movie) => void;
};

export function SearchDialog({
  open,
  onOpenChange,
  onMovieClick,
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Дебаунс запроса
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Выполняем поиск
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setFilteredMovies([]);
        return;
      }

      setIsSearching(true);
      try {
        const result = await movieApi.searchMovies({
          q: debouncedQuery,
          per_page: 20,
        });
        setFilteredMovies(result.items);
      } catch (error) {
        console.error('Search error:', error);
        setFilteredMovies([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleClear = () => {
    setSearchQuery("");
    setFilteredMovies([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Поиск фильмов</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Введите название фильма, чтобы увидеть результаты.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Введите название фильма..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {isSearching ? (
            <div className="text-center py-8 text-muted-foreground">
              Поиск...
            </div>
          ) : searchQuery ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMovies.length > 0 ? (
                filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => {
                      onMovieClick(movie);
                      onOpenChange(false);
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Фильмы не найдены
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Начните вводить название фильма
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}