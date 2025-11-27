import { useState, Dispatch, SetStateAction } from "react";
import { Search } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Movie } from "../types/movie";
import { MovieCard } from "./MovieCard";

type SearchDialogProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
};

export function SearchDialog({
  open,
  onOpenChange,
  movies,
  onMovieClick,
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMovies = movies.filter((movie) => {
    const q = searchQuery.toLowerCase();
    return (
      movie.title.toLowerCase().includes(q) ||
      movie.titleRu?.toLowerCase().includes(q)
    );
  });

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
            className="pl-10"
          />
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {searchQuery ? (
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
