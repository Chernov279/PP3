import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Movie } from "../types/movie";
import { MovieCard } from "./MovieCard";
import { useMutation } from "../hooks/useApi";
import { movieService } from "../services/api";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieClick: (movie: Movie) => void;
}

export function SearchDialog({ open, onOpenChange, onMovieClick }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, loading, mutate: search } = useMutation(movieService.searchFilms);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      search(query.trim());
    }
  };

  const handleMovieClick = (movie: Movie) => {
    onMovieClick(movie);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Поиск фильмов</DialogTitle>
          <DialogDescription>
            Найдите фильм по названию в нашей базе данных
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Введите название фильма..."
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

          {!loading && searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => handleMovieClick(movie)}
                />
              ))}
            </div>
          )}

          {!loading && searchQuery.length > 2 && searchResults && searchResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Фильмы не найдены по запросу "{searchQuery}"
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              Начните вводить название фильма
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
