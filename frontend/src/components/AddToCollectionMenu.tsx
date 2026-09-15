import { useEffect, useState } from "react";
import { FolderPlus, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { CollectionFormDialog } from "./CollectionFormDialog";
import { Collection } from "../types/collection";
import { Movie } from "../types/movie";
import { collectionService } from "../services/api";

interface AddToCollectionMenuProps {
  movie: Movie;
  collections: Collection[];
  onCollectionsChanged?: () => void;
}

export function AddToCollectionMenu({
  movie,
  collections,
  onCollectionsChanged,
}: AddToCollectionMenuProps) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setBusyId(null);
  }, [movie.id]);

  const addTo = async (collection: Collection) => {
    setBusyId(collection.id);
    try {
      await collectionService.addMovie(collection.id, movie.id);
      toast.success(`Добавлено в «${collection.title}»`);
      onCollectionsChanged?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "";
      if (message.toLowerCase().includes("already")) {
        toast.info("Этот фильм уже есть в коллекции");
      } else {
        toast.error(message || "Не удалось добавить фильм в коллекцию");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (data: { title: string; description: string; is_public: boolean }) => {
    setCreating(true);
    try {
      const created = await collectionService.create({
        title: data.title,
        description: data.description || null,
        is_public: data.is_public,
      });
      await collectionService.addMovie(created.id, movie.id);
      toast.success(`Создана коллекция «${created.title}» и фильм добавлен`);
      setFormOpen(false);
      onCollectionsChanged?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "";
      toast.error(message || "Не удалось создать коллекцию");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            В коллекцию
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Мои коллекции</DropdownMenuLabel>
          {collections.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              Пока нет коллекций — создайте первую
            </div>
          ) : (
            collections.map((collection) => (
              <DropdownMenuItem
                key={collection.id}
                disabled={busyId === collection.id}
                onSelect={(event) => {
                  event.preventDefault();
                  addTo(collection);
                }}
              >
                {busyId === collection.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="truncate">{collection.title}</span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setMenuOpen(false);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Новая коллекция
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CollectionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        submitting={creating}
        onSubmit={handleCreate}
      />
    </>
  );
}
