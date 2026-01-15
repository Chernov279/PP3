import { Star, Heart } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Movie } from "../types/api";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { movieApi } from "../services/movieApi";
import { toast } from "sonner";

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  showFavoriteButton?: boolean;
}

export function MovieCard({ movie, onClick, showFavoriteButton = true }: MovieCardProps) {
  const { isAuthenticated, profile, updateUserProfile } = useAuth();
  const [isFavorite, setIsFavorite] = useState(
    profile?.favorite_movies.includes(movie.id) || false
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Войдите в аккаунт, чтобы добавить в избранное');
      return;
    }

    setIsLoading(true);
    try {
      const result = await movieApi.toggleFavorite(movie.id);
      setIsFavorite(result.is_favorite);
      
      if (profile) {
        const updatedFavorites = result.is_favorite
          ? [...profile.favorite_movies, movie.id]
          : profile.favorite_movies.filter(id => id !== movie.id);
        
        await updateUserProfile({
          favorite_movies: updatedFavorites,
        });
      }
      
      toast.success(result.is_favorite ? 'Добавлено в избранное' : 'Удалено из избранного');
    } catch (error) {
      toast.error('Ошибка обновления избранного');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-muted">
        <img
          src={movie.poster_url}
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image';
          }}
        />
        
        {showFavoriteButton && (
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 ${isFavorite ? 'text-red-500' : 'text-white/80'} hover:text-red-500 hover:bg-white/20 transition-colors`}
            onClick={handleFavoriteClick}
            disabled={isLoading}
          >
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
          </Button>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 line-clamp-1" title={movie.title}>
          {movie.title}
        </h3>
        <p className="text-muted-foreground mb-2">{movie.year}</p>
        <div className="flex items-center gap-1 mb-3">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{movie.rating.toFixed(1)}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {movie.genres.slice(0, 2).map((genre) => (
            <Badge key={genre} variant="secondary">
              {genre}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}