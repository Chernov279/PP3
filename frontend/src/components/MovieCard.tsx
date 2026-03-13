import { Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Movie } from "../types/movie";
import { ScoreBadge } from "./ScoreBadge";

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
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
      <CardContent className="p-4">
        <h3 className="mb-1 line-clamp-1">{movie.titleRu || movie.title}</h3>
        <p className="text-muted-foreground mb-2">
          {movie.year && movie.year > 0 ? movie.year : "-"}
        </p>
        <div className="flex items-center gap-1 mb-3">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{movie.rating}</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {movie.genres?.slice(0, 2).map((genre) => (
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
      </CardContent>
    </Card>
  );
}
