import { Star, ExternalLink, Heart } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Movie } from "../types/api";
import { useState, useEffect } from "react";
import { movieApi } from "../services/movieAPI";
import { toast } from "sonner";

type MovieDetailsDialogProps = {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function MovieDetailsDialog({
  movie,
  open,
  onOpenChange,
  isFavorite,
  onToggleFavorite,
}: MovieDetailsDialogProps) {
  const [fullMovie, setFullMovie] = useState<Movie | null>(movie);
  const [loading, setLoading] = useState(false);

  // Загружаем полную информацию о фильме при открытии
  useEffect(() => {
    const loadFullMovie = async () => {
      if (!movie) return;
      
      try {
        setLoading(true);
        const movieData = await movieApi.getMovieById(movie.id);
        setFullMovie(movieData);
      } catch (error) {
        console.error('Failed to load movie details:', error);
        setFullMovie(movie);
      } finally {
        setLoading(false);
      }
    };

    if (open && movie) {
      loadFullMovie();
    }
  }, [open, movie]);

  if (!fullMovie) return null;

  const handleFavoriteClick = async () => {
    try {
      onToggleFavorite();
    } catch (error) {
      toast.error('Ошибка обновления избранного');
    }
  };

  const handleWatchTrailer = () => {
    if (fullMovie.trailer_url) {
      window.open(fullMovie.trailer_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fullMovie.title}</DialogTitle>
          {fullMovie.original_title !== fullMovie.title && (
            <p className="text-sm text-muted-foreground">
              {fullMovie.original_title}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : (
          <div className="grid md:grid-cols-[300px,1fr] gap-6">
            <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-muted">
              <img
                src={fullMovie.poster_url}
                alt={fullMovie.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image';
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span>{fullMovie.rating.toFixed(1)}</span>
                </div>

                <span className="text-muted-foreground">{fullMovie.year}</span>

                <span className="text-muted-foreground">
                  {Math.floor(fullMovie.duration / 60)}ч {fullMovie.duration % 60}м
                </span>

                <Button
                  variant={isFavorite ? "default" : "outline"}
                  size="sm"
                  onClick={handleFavoriteClick}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${
                      isFavorite ? "fill-current" : ""
                    }`}
                  />
                  {isFavorite ? "В избранном" : "В избранное"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {fullMovie.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>

              {fullMovie.description && (
                <div>
                  <h4 className="mb-2">Описание</h4>
                  <p className="text-muted-foreground">{fullMovie.description}</p>
                </div>
              )}

              {fullMovie.director && (
                <div>
                  <h4 className="mb-2">Режиссёр</h4>
                  <p className="text-muted-foreground">{fullMovie.director}</p>
                </div>
              )}

              {fullMovie.actors && fullMovie.actors.length > 0 && (
                <div>
                  <h4 className="mb-2">В ролях</h4>
                  <p className="text-muted-foreground">
                    {fullMovie.actors.slice(0, 5).join(", ")}
                    {fullMovie.actors.length > 5 ? "..." : ""}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {fullMovie.trailer_url && (
                  <Button className="flex-1" onClick={handleWatchTrailer}>
                    Смотреть трейлер
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Страна: {fullMovie.country || "Не указано"}</p>
                <p>Язык: {fullMovie.language || "Не указано"}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}