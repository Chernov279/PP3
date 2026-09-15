import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Person } from "../types/movie";

interface PersonCardProps {
  person: Person;
  onClick?: () => void;
  compact?: boolean;
}

export function parseProfessions(profession?: string | null): string[] {
  if (!profession) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of profession.split(/[,;/|]/)) {
    const label = part.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(label);
  }
  return result;
}

export function personDisplayName(person: Person): string {
  return person.name_ru || person.name_en || `Персона #${person.id}`;
}

export function PersonCard({ person, onClick, compact = false }: PersonCardProps) {
  const displayName = personDisplayName(person);
  const professions = parseProfessions(person.profession);
  const secondaryName =
    person.name_en && person.name_ru && person.name_en !== person.name_ru
      ? person.name_en
      : null;

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
        <h3 className={`mb-1 ${compact ? "line-clamp-2 text-sm leading-snug" : "line-clamp-1"}`}>
          {displayName}
        </h3>
        <p className="text-muted-foreground mb-2">
          {secondaryName || (compact ? professions[0] ?? "-" : "-")}
        </p>
        {!compact && professions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {professions.slice(0, 2).map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
