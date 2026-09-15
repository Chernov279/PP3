import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Person } from "../types/movie";

interface PersonCardProps {
  person: Person;
  onClick?: () => void;
  compact?: boolean;
}

export function PersonCard({ person, onClick, compact = false }: PersonCardProps) {
  const displayName =
    person.name_ru || person.name_en || `Персона #${person.id}`;

  return (
    <Card
      className={`overflow-hidden scrollbar-hidden ${onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""} h-full`}
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {person.poster_url ? (
          <img
            src={person.poster_url}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="px-2 text-center text-xs text-muted-foreground">
            ФОТО НЕДОСТУПНО
          </span>
        )}
      </div>
      <CardContent className={`min-w-0 overflow-hidden ${compact ? "p-3" : "p-4"}`}>
        <h3 className={`mb-1 line-clamp-2 ${compact ? "text-sm leading-snug" : ""}`}>
          {displayName}
        </h3>
        {person.profession && (
          <Badge variant="secondary" className="max-w-full truncate">
            {person.profession}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
