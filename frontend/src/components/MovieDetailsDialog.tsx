import { useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, Heart, ExternalLink, Loader2 } from "lucide-react";
import { Movie } from "../types/movie";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { ScoreBadge } from "./ScoreBadge";
import { useApi } from "../hooks/useApi";
import { movieService } from "../services/api";

interface MovieDetailsDialogProps {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function MovieDetailsDialog({ 
  movie, 
  open, 
  onOpenChange, 
  isFavorite, 
  onToggleFavorite 
}: MovieDetailsDialogProps) {
  const { isAuthenticated } = useAuth();

  // Memoize the api function to strictly prevent infinite loops in useApi
  const fetchSimilarMovies = useCallback(() => {
    return movie ? movieService.getSimilarFilms(movie.id) : Promise.resolve([]);
  }, [movie?.id]);

  // Загружаем похожие фильмы из API
  const { data: similarMovies, loading: similarLoading } = useApi(
    fetchSimilarMovies,
    { immediate: !!movie?.id && open }
  );

  if (!movie) return null;

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Войдите в аккаунт, чтобы добавлять фильмы в избранное");
      return;
    }
    onToggleFavorite();
  };

  const handleSimilarMovieClick = (similarMovie: Movie) => {
    onOpenChange(false);
    setTimeout(() => {
      toast.info(`Открыт фильм: ${similarMovie.titleRu || similarMovie.title}`);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle>{movie.titleRu || movie.title}</DialogTitle>
          <DialogDescription>
            {movie.year} • {movie.genres?.map(g => g.name).join(", ")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-[300px,1fr] gap-6">
          <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-muted">
            <img
              src={movie.poster}
              alt={movie.titleRu || movie.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span>{movie.rating}</span>
              </div>
              <span className="text-muted-foreground">{movie.year}</span>
              <Button
                variant={isFavorite ? "default" : "outline"}
                size="sm"
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "В избранном" : "В избранное"}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((genre) => (
                <Badge key={genre.id || genre.name} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
            </div>

            <ScoreBadge
              popularity_score={movie.popularity_score}
              novelty_score={movie.novelty_score}
              personalization_score={movie.personalization_score}
              total_score={movie.total_score}
            />
            
            {movie.imdbRating && (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-muted-foreground">IMDb</p>
                  <p>{movie.imdbRating}</p>
                </div>
                {movie.kinopoiskRating && (
                  <div>
                    <p className="text-muted-foreground">Кинопоиск</p>
                    <p>{movie.kinopoiskRating}</p>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <h4 className="mb-2">Описание</h4>
              <p className="text-muted-foreground">{movie.description}</p>
            </div>

            {similarLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Загрузка похожих фильмов...</span>
              </div>
            ) : (
              similarMovies && similarMovies.length > 0 && (
                <div>
                  <h4 className="mb-2">Похожие</h4>
                  <div className="flex flex-wrap gap-2">
                    {similarMovies.map((similarMovie) => (
                      <Button
                        key={similarMovie.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSimilarMovieClick(similarMovie)}
                        className="text-sm"
                      >
                        {similarMovie.titleRu || similarMovie.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )
            )}
            
            {movie.playerUrl && (
              <Button className="w-full" asChild>
                <a href={movie.playerUrl} target="_blank" rel="noopener noreferrer">
                  Открыть в плеере
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
