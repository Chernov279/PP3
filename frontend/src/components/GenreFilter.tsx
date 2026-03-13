import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Filter } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface GenreFilterProps {
  allGenres: string[];
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  favoriteGenres?: string[];
}

export function GenreFilter({
  allGenres,
  selectedGenres,
  onGenresChange,
  favoriteGenres = [],
}: GenreFilterProps) {
  const [open, setOpen] = useState(false);
  const [draftGenres, setDraftGenres] = useState<string[]>(selectedGenres);

  useEffect(() => {
    setDraftGenres(selectedGenres);
  }, [selectedGenres]);

  const hasChanges = 
    draftGenres.length !== selectedGenres.length ||
    draftGenres.some(g => !selectedGenres.includes(g)) ||
    selectedGenres.some(g => !draftGenres.includes(g));

  const handleToggleGenre = (genre: string) => {
    setDraftGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleApply = () => {
    onGenresChange(draftGenres);
    setOpen(false);
  };

  const handleReset = () => {
    setDraftGenres([]);
  };

  const handleAddFavorites = () => {
    setDraftGenres((prev) => {
      const next = new Set(prev);
      favoriteGenres.forEach((g) => next.add(g));
      return Array.from(next);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Жанры
          {selectedGenres.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedGenres.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Выбор жанров</DialogTitle>
          <DialogDescription>
            Выберите жанры для фильтрации фильмов
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="grid grid-cols-2 gap-3">
            {allGenres.map((genre) => (
              <div
                key={genre}
                className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                onClick={() => handleToggleGenre(genre)}
              >
                <Checkbox
                  id={genre}
                  checked={draftGenres.includes(genre)}
                  onCheckedChange={() => handleToggleGenre(genre)}
                />
                <label
                  htmlFor={genre}
                  className="text-sm cursor-pointer flex-1"
                >
                  {genre}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span>Выбрано: {draftGenres.length}</span>
            {favoriteGenres.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="px-0 justify-start"
                onClick={handleAddFavorites}
              >
                Добавить любимые жанры
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            Сбросить
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Отмена
          </Button>
          <Button
            onClick={handleApply}
            disabled={!hasChanges}
          >
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
