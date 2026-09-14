import { Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Movie } from "../types/movie";
import { ScoreBadge } from "./ScoreBadge";

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  compact?: boolean;
}

export function MovieCard({ movie, onClick, compact = false }: MovieCardProps) {
  const hasScores =
    movie.popularity_score != null ||
    movie.novelty_score != null ||
    movie.personalization_score != null ||
    movie.total_score != null;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-muted flex items-center justify-center">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.titleRu || movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
        {!movie.poster && (
          <span className="px-2 text-center text-xs text-muted-foreground">
            ИЗОБРАЖЕНИЕ НЕДОСТУПНО
          </span>
        )}
      </div>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <h3 className={`mb-1 ${compact ? "line-clamp-2 text-sm leading-snug" : "line-clamp-1"}`}>
          {movie.titleRu || movie.title}
        </h3>
        <p className="text-muted-foreground mb-2">
          {movie.year && movie.year > 0 ? movie.year : "-"}
        </p>
        <div className="flex items-center gap-1 mb-3">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{movie.rating}</span>
        </div>
        {!compact && (
          <div className="flex flex-wrap gap-1 mb-3">
            {movie.genres?.slice(0, 2).map((genre) => (
              <Badge key={genre.id || genre.name} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </div>
        )}
        {hasScores && !compact && (
          <ScoreBadge
            popularity_score={movie.popularity_score}
            novelty_score={movie.novelty_score}
            personalization_score={movie.personalization_score}
            total_score={movie.total_score}
          />
        )}
      </CardContent>
    </Card>
  );
}
