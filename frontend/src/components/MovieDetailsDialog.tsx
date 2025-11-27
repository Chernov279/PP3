import { Star, ExternalLink, Heart } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Movie } from "../types/movie";
import { Dispatch, SetStateAction } from "react";

type MovieDetailsDialogProps = {
  movie: Movie | null;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
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
  if (!movie) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{movie.titleRu || movie.title}</DialogTitle>

          {/* ✔ исправляет warning Missing Description */}
          <DialogDescription className="text-muted-foreground">
            {movie.description}
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span>{movie.rating}</span>
              </div>

              <span className="text-muted-foreground">{movie.year}</span>

              <Button
                variant={isFavorite ? "default" : "outline"}
                size="sm"
                onClick={onToggleFavorite}
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${
                    isFavorite ? "fill-current" : ""
                  }`}
                />
                {isFavorite ? "В избранном" : "В избранное"}
              </Button>
            </div>

            {/* ✔ genres теперь строго string[], ошибок нет */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>

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
              <h4 className="mb-2">Режиссёр</h4>
              <p className="text-muted-foreground">{movie.director}</p>
            </div>

            <div>
              <h4 className="mb-2">В ролях</h4>
              <p className="text-muted-foreground">
                {movie.actors.join(", ")}
              </p>
            </div>

            <Button className="w-full" asChild>
              <a href={movie.playerUrl} target="_blank" rel="noopener noreferrer">
                Открыть в плеере
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
