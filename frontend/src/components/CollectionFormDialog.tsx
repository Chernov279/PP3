import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Collection } from "../types/collection";

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Collection | null;
  submitting?: boolean;
  onSubmit: (data: { title: string; description: string; is_public: boolean }) => Promise<void> | void;
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  initial,
  submitting = false,
  onSubmit,
}: CollectionFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setIsPublic(Boolean(initial?.is_public));
  }, [open, initial]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await onSubmit({
      title: trimmed.slice(0, 255),
      description: description.trim(),
      is_public: isPublic,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{initial ? "Редактировать коллекцию" : "Новая коллекция"}</DialogTitle>
            <DialogDescription>
              Соберите подборку фильмов и решите, видят ли её другие пользователи.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="collection-title">Название</Label>
            <Input
              id="collection-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="Например: Лучшие нуары"
              autoFocus
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-description">Описание</Label>
            <Textarea
              id="collection-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко, о чём эта подборка"
              className="min-h-24"
              disabled={submitting}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="pr-4">
              <Label htmlFor="collection-public">Публичная коллекция</Label>
              <p className="text-sm text-muted-foreground">
                Другие смогут найти её во вкладке «Публичные»
              </p>
            </div>
            <Switch
              id="collection-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={submitting}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Отмена
            </Button>
            <Button type="submit" disabled={!title.trim() || submitting}>
              {initial ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
