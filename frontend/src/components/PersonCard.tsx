import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Person } from "../types/movie";

interface PersonCardProps {
  person: Person;
  onClick?: () => void;
}

export function PersonCard({ person, onClick }: PersonCardProps) {
  const displayName =
    person.name_ru || person.name_en || `Персона #${person.id}`;

  return (
    <Card
      className={`overflow-hidden ${onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-muted flex items-center justify-center">
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
      <CardContent className="p-4">
        <h3 className="mb-1 line-clamp-2">{displayName}</h3>
        {person.profession && (
          <Badge variant="secondary" className="line-clamp-1">
            {person.profession}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
