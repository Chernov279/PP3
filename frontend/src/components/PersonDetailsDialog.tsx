import { useCallback } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Person } from "../types/movie";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";
import { personService } from "../services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface PersonDetailsDialogProps {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function PersonDetailsDialog({
  person,
  open,
  onOpenChange,
  isFavorite,
  onToggleFavorite,
}: PersonDetailsDialogProps) {
  const { isAuthenticated } = useAuth();

  const fetchPerson = useCallback(() => {
    if (!person?.id) return Promise.resolve(null);
    return personService.getById(person.id);
  }, [person?.id]);

  const { data: details, loading } = useApi(fetchPerson, {
    immediate: !!person?.id && open,
  });

  if (!person) return null;

  const display = details ?? person;
  const displayName =
    display.name_ru || display.name_en || `Персона #${display.id}`;

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Войдите в аккаунт, чтобы добавлять персон в избранное");
      return;
    }
    onToggleFavorite();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>
            {display.profession || "Персона кинематографа"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-[240px,1fr] gap-6">
            <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              {display.poster_url ? (
                <img
                  src={display.poster_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground px-3 text-center">
                  ФОТО НЕДОСТУПНО
                </span>
              )}
            </div>
            <div className="space-y-4">
              {display.profession && (
                <Badge variant="secondary">{display.profession}</Badge>
              )}
              {display.name_en && display.name_ru && (
                <p className="text-muted-foreground">{display.name_en}</p>
              )}
              <Button
                variant={isFavorite ? "default" : "outline"}
                size="sm"
                onClick={handleToggleFavorite}
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`}
                />
                {isFavorite ? "В избранном" : "В избранное"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
