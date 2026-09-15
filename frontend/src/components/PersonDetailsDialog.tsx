import { useCallback } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Person } from "../types/movie";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";
import { personService } from "../services/api";
import { parseProfessions, personDisplayName } from "./PersonCard";
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
  const displayName = personDisplayName(display);
  const professions = parseProfessions(display.profession);
  const englishName =
    display.name_en && display.name_ru && display.name_en !== display.name_ru
      ? display.name_en
      : null;

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Войдите в аккаунт, чтобы добавлять персон в избранное");
      return;
    }
    onToggleFavorite();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>
            {englishName || "Персона кинематографа"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-[300px,1fr] gap-6">
            <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-muted flex items-center justify-center">
              {display.poster_url ? (
                <img
                  src={display.poster_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-xs text-muted-foreground px-3 text-center">
                  ФОТО НЕДОСТУПНО
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
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

              {professions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {professions.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
