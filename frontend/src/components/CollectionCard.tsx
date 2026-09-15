import { Globe, Lock, Library } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Collection } from "../types/collection";

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
  isOwner?: boolean;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CollectionCard({ collection, onClick, isOwner = false }: CollectionCardProps) {
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full"
      onClick={onClick}
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-muted flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/5" />
        <Library className="h-12 w-12 text-primary/70 relative" />
      </div>
      <CardContent className="p-4 space-y-2 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 leading-snug">{collection.title}</h3>
          <Badge variant={collection.is_public ? "secondary" : "outline"} className="shrink-0">
            {collection.is_public ? (
              <Globe className="h-3 w-3 mr-1" />
            ) : (
              <Lock className="h-3 w-3 mr-1" />
            )}
            {collection.is_public ? "Публичная" : "Личная"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {collection.description?.trim() || "Без описания"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isOwner ? "Ваша коллекция · " : ""}
          {formatDate(collection.created_at)}
        </p>
      </CardContent>
    </Card>
  );
}
